use crate::db;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScheduledPost {
    pub id: String,
    pub document_id: String,
    pub platform: String,
    pub account_id: String,
    pub publication_id: Option<String>,
    pub title: String,
    pub scheduled_at: String,
    pub status: String,
    pub error_message: Option<String>,
    pub published_url: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CalendarEvent {
    pub id: String,
    pub title: String,
    pub date: String,
    pub event_type: String, // "scheduled" | "published" | "draft"
    pub platform: Option<String>,
    pub status: String,
    pub document_id: Option<String>,
}

#[tauri::command]
pub async fn schedule_post(
    app: AppHandle,
    document_id: String,
    platform: String,
    account_id: String,
    publication_id: Option<String>,
    title: String,
    scheduled_at: String,
) -> Result<ScheduledPost, String> {
    let conn = db::get_db(&app)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO scheduled_posts (id, document_id, platform, account_id, publication_id, title, scheduled_at, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'pending', ?8, ?8)",
        rusqlite::params![id, document_id, platform, account_id, publication_id, title, scheduled_at, now],
    )
    .map_err(|e| format!("Failed to schedule post: {}", e))?;

    // Update document status
    conn.execute(
        "UPDATE documents SET status = 'scheduled', scheduled_at = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![scheduled_at, now, document_id],
    ).ok();

    db::log_activity(&conn, "post.scheduled", "scheduled_post", Some(&id), Some(&format!("Scheduled for {} on {}", platform, scheduled_at)));

    Ok(ScheduledPost {
        id,
        document_id,
        platform,
        account_id,
        publication_id,
        title,
        scheduled_at,
        status: "pending".to_string(),
        error_message: None,
        published_url: None,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub async fn list_scheduled_posts(
    app: AppHandle,
    from: Option<String>,
    to: Option<String>,
    status: Option<String>,
) -> Result<Vec<ScheduledPost>, String> {
    let conn = db::get_db(&app)?;

    let mut sql = String::from(
        "SELECT id, document_id, platform, account_id, publication_id, title, scheduled_at, status, error_message, published_url, created_at, updated_at
         FROM scheduled_posts WHERE 1=1",
    );
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref f) = from {
        sql.push_str(&format!(" AND scheduled_at >= ?{}", params.len() + 1));
        params.push(Box::new(f.clone()));
    }
    if let Some(ref t) = to {
        sql.push_str(&format!(" AND scheduled_at <= ?{}", params.len() + 1));
        params.push(Box::new(t.clone()));
    }
    if let Some(ref s) = status {
        sql.push_str(&format!(" AND status = ?{}", params.len() + 1));
        params.push(Box::new(s.clone()));
    }

    sql.push_str(" ORDER BY scheduled_at ASC");

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn.prepare(&sql).map_err(|e| format!("Query failed: {}", e))?;
    let rows = stmt
        .query_map(param_refs.as_slice(), |row| {
            Ok(ScheduledPost {
                id: row.get(0)?,
                document_id: row.get(1)?,
                platform: row.get(2)?,
                account_id: row.get(3)?,
                publication_id: row.get(4)?,
                title: row.get(5)?,
                scheduled_at: row.get(6)?,
                status: row.get(7)?,
                error_message: row.get(8)?,
                published_url: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })
        .map_err(|e| format!("Query map failed: {}", e))?;

    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub async fn cancel_scheduled_post(app: AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    let now = Utc::now().to_rfc3339();

    // Get document_id before deleting
    let doc_id: Option<String> = conn
        .query_row(
            "SELECT document_id FROM scheduled_posts WHERE id = ?1",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .ok();

    conn.execute(
        "DELETE FROM scheduled_posts WHERE id = ?1",
        rusqlite::params![id],
    )
    .map_err(|e| format!("Failed to cancel: {}", e))?;

    // Reset document status to draft if it was scheduled
    if let Some(doc_id) = doc_id {
        conn.execute(
            "UPDATE documents SET status = 'draft', scheduled_at = NULL, updated_at = ?1 WHERE id = ?2 AND status = 'scheduled'",
            rusqlite::params![now, doc_id],
        ).ok();
    }

    Ok(())
}

#[tauri::command]
pub async fn reschedule_post(
    app: AppHandle,
    id: String,
    new_scheduled_at: String,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE scheduled_posts SET scheduled_at = ?1, status = 'pending', error_message = NULL, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![new_scheduled_at, now, id],
    )
    .map_err(|e| format!("Failed to reschedule: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn publish_scheduled_now(app: AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    let now = Utc::now().to_rfc3339();

    // Set scheduled_at to now so the scheduler picks it up on next tick
    conn.execute(
        "UPDATE scheduled_posts SET scheduled_at = ?1, status = 'pending', updated_at = ?1 WHERE id = ?2",
        rusqlite::params![now, id],
    )
    .map_err(|e| format!("Failed to publish now: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_calendar_events(
    app: AppHandle,
    year: i32,
    month: u32,
) -> Result<Vec<CalendarEvent>, String> {
    let conn = db::get_db(&app)?;

    // Build date range for the month (with padding for calendar display)
    let start = format!("{:04}-{:02}-01T00:00:00Z", year, month);
    let end_month = if month == 12 { 1 } else { month + 1 };
    let end_year = if month == 12 { year + 1 } else { year };
    let end = format!("{:04}-{:02}-01T00:00:00Z", end_year, end_month);

    let mut events = Vec::new();

    // Scheduled posts
    {
        let mut stmt = conn
            .prepare(
                "SELECT id, title, scheduled_at, platform, status, document_id
                 FROM scheduled_posts
                 WHERE scheduled_at >= ?1 AND scheduled_at < ?2
                 ORDER BY scheduled_at ASC",
            )
            .map_err(|e| format!("Query failed: {}", e))?;

        let rows = stmt
            .query_map(rusqlite::params![start, end], |row| {
                Ok(CalendarEvent {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    date: row.get(2)?,
                    event_type: "scheduled".to_string(),
                    platform: row.get(3)?,
                    status: row.get(4)?,
                    document_id: row.get(5)?,
                })
            })
            .map_err(|e| format!("Query map failed: {}", e))?;

        events.extend(rows.filter_map(|r| r.ok()));
    }

    // Published documents (not from scheduler)
    {
        let mut stmt = conn
            .prepare(
                "SELECT id, title, published_at, status
                 FROM documents
                 WHERE published_at IS NOT NULL AND published_at >= ?1 AND published_at < ?2
                 AND id NOT IN (SELECT document_id FROM scheduled_posts WHERE status = 'published')
                 ORDER BY published_at ASC",
            )
            .map_err(|e| format!("Query failed: {}", e))?;

        let rows = stmt
            .query_map(rusqlite::params![start, end], |row| {
                Ok(CalendarEvent {
                    id: row.get::<_, String>(0)?,
                    title: row.get(1)?,
                    date: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                    event_type: "published".to_string(),
                    platform: None,
                    status: row.get(3)?,
                    document_id: Some(row.get::<_, String>(0)?),
                })
            })
            .map_err(|e| format!("Query map failed: {}", e))?;

        events.extend(rows.filter_map(|r| r.ok()));
    }

    // Draft documents with no schedule (for visibility)
    {
        let mut stmt = conn
            .prepare(
                "SELECT id, title, updated_at, status
                 FROM documents
                 WHERE status = 'draft' AND updated_at >= ?1 AND updated_at < ?2
                 ORDER BY updated_at ASC
                 LIMIT 20",
            )
            .map_err(|e| format!("Query failed: {}", e))?;

        let rows = stmt
            .query_map(rusqlite::params![start, end], |row| {
                Ok(CalendarEvent {
                    id: row.get::<_, String>(0)?,
                    title: row.get(1)?,
                    date: row.get(2)?,
                    event_type: "draft".to_string(),
                    platform: None,
                    status: "draft".to_string(),
                    document_id: Some(row.get::<_, String>(0)?),
                })
            })
            .map_err(|e| format!("Query map failed: {}", e))?;

        events.extend(rows.filter_map(|r| r.ok()));
    }

    Ok(events)
}
