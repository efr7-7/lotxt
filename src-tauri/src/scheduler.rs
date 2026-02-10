use crate::commands::platform::PublishRequest;
use crate::db;
use crate::services::PlatformService;
use chrono::Utc;
use serde::Serialize;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tauri_plugin_store::StoreExt;

#[derive(Clone, Serialize)]
struct ScheduleEvent {
    id: String,
    document_id: String,
    platform: String,
    status: String,
    message: String,
}

pub fn start_scheduler(app: AppHandle) {
    tokio::spawn(async move {
        // Wait 5 seconds after startup before first check
        tokio::time::sleep(Duration::from_secs(5)).await;

        let mut interval = tokio::time::interval(Duration::from_secs(30));
        loop {
            interval.tick().await;
            if let Err(e) = check_and_publish(&app).await {
                eprintln!("[Scheduler] Error: {}", e);
            }
        }
    });
}

async fn check_and_publish(app: &AppHandle) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();

    // Get all due posts
    let due_posts: Vec<(String, String, String, String, Option<String>, String)> = {
        let conn = db::get_db(app)?;
        let mut stmt = conn
            .prepare(
                "SELECT id, document_id, platform, account_id, publication_id, title
                 FROM scheduled_posts
                 WHERE scheduled_at <= ?1 AND status = 'pending'
                 ORDER BY scheduled_at ASC",
            )
            .map_err(|e| format!("Query failed: {}", e))?;

        let rows = stmt
            .query_map(rusqlite::params![now], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, Option<String>>(4)?,
                    row.get::<_, String>(5)?,
                ))
            })
            .map_err(|e| format!("Query map failed: {}", e))?;

        rows.filter_map(|r| r.ok()).collect()
    };

    for (post_id, document_id, platform, account_id, publication_id, title) in due_posts {
        // Mark as publishing
        {
            let conn = db::get_db(app)?;
            conn.execute(
                "UPDATE scheduled_posts SET status = 'publishing', updated_at = ?1 WHERE id = ?2",
                rusqlite::params![now, post_id],
            )
            .ok();
        }

        // Load document content
        let html_content: String = {
            let conn = db::get_db(app)?;
            conn.query_row(
                "SELECT html_content FROM documents WHERE id = ?1",
                rusqlite::params![document_id],
                |row| row.get(0),
            )
            .unwrap_or_default()
        };

        if html_content.is_empty() {
            // Mark as failed
            let conn = db::get_db(app)?;
            conn.execute(
                "UPDATE scheduled_posts SET status = 'failed', error_message = 'Document content is empty', updated_at = ?1 WHERE id = ?2",
                rusqlite::params![now, post_id],
            ).ok();
            continue;
        }

        // Get API key
        let api_key = {
            let store = app
                .store("credentials.json")
                .map_err(|e| format!("Store error: {}", e))?;
            let key = format!("{}:{}", platform, account_id);
            match store.get(&key) {
                Some(val) => {
                    let cred: Option<crate::commands::credentials::StoredCredential> =
                        serde_json::from_value(val.clone()).ok();
                    cred.map(|c| c.api_key).unwrap_or_default()
                }
                None => String::new(),
            }
        };

        if api_key.is_empty() {
            let conn = db::get_db(app)?;
            conn.execute(
                "UPDATE scheduled_posts SET status = 'failed', error_message = 'No API key found for account', updated_at = ?1 WHERE id = ?2",
                rusqlite::params![now, post_id],
            ).ok();
            continue;
        }

        // Publish via platform service
        let pub_id = publication_id.as_deref().unwrap_or("default");
        let request = PublishRequest {
            title: title.clone(),
            html_content: html_content.clone(),
            subtitle: None,
            preview_text: None,
            status: "draft".to_string(),
        };
        let result = match platform.as_str() {
            "beehiiv" => {
                crate::services::beehiiv::BeehiivService::publish(&api_key, pub_id, request).await
            }
            "substack" => {
                crate::services::substack::SubstackService::publish(&api_key, pub_id, request).await
            }
            "kit" => {
                crate::services::kit::KitService::publish(&api_key, pub_id, request).await
            }
            "ghost" => {
                crate::services::ghost::GhostService::publish(&api_key, pub_id, request).await
            }
            _ => Err(format!("Unsupported platform: {}", platform)),
        };

        let updated_now = Utc::now().to_rfc3339();
        match result {
            Ok(url) => {
                let conn = db::get_db(app)?;
                conn.execute(
                    "UPDATE scheduled_posts SET status = 'published', published_url = ?1, updated_at = ?2 WHERE id = ?3",
                    rusqlite::params![url, updated_now, post_id],
                ).ok();

                // Update document status
                conn.execute(
                    "UPDATE documents SET status = 'published', published_at = ?1, updated_at = ?1 WHERE id = ?2",
                    rusqlite::params![updated_now, document_id],
                ).ok();

                db::log_activity(&conn, "post.published", "scheduled_post", Some(&post_id), Some(&format!("Published to {} via scheduler", platform)));

                let _ = app.emit(
                    "schedule:published",
                    ScheduleEvent {
                        id: post_id,
                        document_id,
                        platform: platform.clone(),
                        status: "published".to_string(),
                        message: format!("Published to {}", platform),
                    },
                );
            }
            Err(e) => {
                let conn = db::get_db(app)?;
                conn.execute(
                    "UPDATE scheduled_posts SET status = 'failed', error_message = ?1, updated_at = ?2 WHERE id = ?3",
                    rusqlite::params![e, updated_now, post_id],
                ).ok();

                let _ = app.emit(
                    "schedule:failed",
                    ScheduleEvent {
                        id: post_id,
                        document_id,
                        platform: platform.clone(),
                        status: "failed".to_string(),
                        message: e,
                    },
                );
            }
        }
    }

    Ok(())
}
