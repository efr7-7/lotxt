use crate::db;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnifiedSubscriber {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub platforms: Vec<PlatformLink>,
    pub engagement_score: f64,
    pub total_opens: i64,
    pub total_clicks: i64,
    pub first_seen_at: String,
    pub last_seen_at: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlatformLink {
    pub platform: String,
    pub account_id: String,
    pub status: String,
    pub subscribed_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaginatedSubscribers {
    pub subscribers: Vec<UnifiedSubscriber>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AudienceStats {
    pub total_unique: i64,
    pub new_last_30d: i64,
    pub avg_engagement: f64,
    pub platform_breakdown: Vec<PlatformCount>,
    pub growth_data: Vec<GrowthPoint>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlatformCount {
    pub platform: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GrowthPoint {
    pub date: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Segment {
    pub name: String,
    pub description: String,
    pub count: i64,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SyncResult {
    pub synced: i64,
    pub new_subscribers: i64,
    pub updated: i64,
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn sync_subscribers(
    app: AppHandle,
    platform: String,
    account_id: String,
    publication_id: Option<String>,
) -> Result<SyncResult, String> {
    // Get API key
    let api_key = {
        let store = app.store("credentials.json").map_err(|e| format!("Store error: {}", e))?;
        let key = format!("{}:{}", platform, account_id);
        match store.get(&key) {
            Some(val) => {
                let cred: crate::commands::credentials::StoredCredential =
                    serde_json::from_value(val.clone()).map_err(|e| format!("Parse error: {}", e))?;
                cred.api_key
            }
            None => return Err("No credentials found".to_string()),
        }
    };

    // Fetch subscribers using the existing PlatformService trait
    use crate::services::PlatformService;
    let platform_subs = match platform.as_str() {
        "beehiiv" => crate::services::beehiiv::BeehiivService::get_subscribers(&api_key, publication_id.as_deref()).await?,
        "kit" => crate::services::kit::KitService::get_subscribers(&api_key, publication_id.as_deref()).await?,
        "ghost" => crate::services::ghost::GhostService::get_subscribers(&api_key, publication_id.as_deref()).await?,
        "substack" => crate::services::substack::SubstackService::get_subscribers(&api_key, publication_id.as_deref()).await?,
        _ => return Err(format!("Subscriber sync not supported for {}", platform)),
    };

    let conn = db::get_db(&app)?;
    let now = Utc::now().to_rfc3339();
    let mut new_count = 0i64;
    let mut updated_count = 0i64;

    for sub in &platform_subs {
        let email = sub.email.trim().to_lowercase();
        if email.is_empty() {
            continue;
        }

        // Check if subscriber exists
        let existing_id: Option<String> = conn
            .query_row(
                "SELECT id FROM subscribers WHERE email = ?1",
                rusqlite::params![email],
                |row| row.get(0),
            )
            .ok();

        let sub_id = if let Some(id) = existing_id {
            // Update last_seen_at
            conn.execute(
                "UPDATE subscribers SET last_seen_at = ?1, updated_at = ?1 WHERE id = ?2",
                rusqlite::params![now, id],
            ).ok();
            updated_count += 1;
            id
        } else {
            // Insert new subscriber
            let id = uuid::Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO subscribers (id, email, name, first_seen_at, last_seen_at, engagement_score, total_opens, total_clicks, created_at, updated_at)
                 VALUES (?1, ?2, NULL, ?3, ?3, 0.0, 0, 0, ?3, ?3)",
                rusqlite::params![id, email, now],
            ).ok();
            new_count += 1;
            id
        };

        // Upsert platform link
        conn.execute(
            "INSERT OR REPLACE INTO subscriber_platforms (subscriber_id, platform, platform_subscriber_id, account_id, status, subscribed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                sub_id,
                platform,
                sub.id,
                account_id,
                sub.status,
                sub.created_at,
            ],
        ).ok();
    }

    db::log_activity(
        &conn,
        "audience.synced",
        "subscribers",
        None,
        Some(&format!("Synced {} from {}: {} new, {} updated", platform_subs.len(), platform, new_count, updated_count)),
    );

    Ok(SyncResult {
        synced: platform_subs.len() as i64,
        new_subscribers: new_count,
        updated: updated_count,
    })
}

#[tauri::command]
pub async fn get_unified_subscribers(
    app: AppHandle,
    page: Option<i64>,
    per_page: Option<i64>,
    search: Option<String>,
    tag: Option<String>,
    sort_by: Option<String>,
    sort_dir: Option<String>,
) -> Result<PaginatedSubscribers, String> {
    let conn = db::get_db(&app)?;
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(50).min(200);
    let offset = (page - 1) * per_page;

    let sort_column = match sort_by.as_deref() {
        Some("email") => "s.email",
        Some("engagement") => "s.engagement_score",
        Some("first_seen") => "s.first_seen_at",
        Some("last_seen") => "s.last_seen_at",
        _ => "s.last_seen_at",
    };
    let direction = if sort_dir.as_deref() == Some("asc") { "ASC" } else { "DESC" };

    let mut where_clauses = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref q) = search {
        let param_idx = params.len() + 1;
        where_clauses.push(format!("(s.email LIKE ?{0} OR s.name LIKE ?{0})", param_idx));
        params.push(Box::new(format!("%{}%", q)));
    }

    if let Some(ref t) = tag {
        let param_idx = params.len() + 1;
        where_clauses.push(format!(
            "s.id IN (SELECT subscriber_id FROM subscriber_tags WHERE tag = ?{})",
            param_idx
        ));
        params.push(Box::new(t.clone()));
    }

    let where_sql = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    // Get total
    let count_sql = format!("SELECT COUNT(*) FROM subscribers s {}", where_sql);
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let total: i64 = conn
        .query_row(&count_sql, param_refs.as_slice(), |row| row.get(0))
        .unwrap_or(0);

    // Get page
    let query_sql = format!(
        "SELECT s.id, s.email, s.name, s.engagement_score, s.total_opens, s.total_clicks, s.first_seen_at, s.last_seen_at
         FROM subscribers s
         {} ORDER BY {} {} LIMIT ?{} OFFSET ?{}",
        where_sql,
        sort_column,
        direction,
        params.len() + 1,
        params.len() + 2,
    );
    params.push(Box::new(per_page));
    params.push(Box::new(offset));

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn.prepare(&query_sql).map_err(|e| format!("Query failed: {}", e))?;
    let rows = stmt
        .query_map(param_refs.as_slice(), |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, f64>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, i64>(5)?,
                row.get::<_, String>(6)?,
                row.get::<_, String>(7)?,
            ))
        })
        .map_err(|e| format!("Query map failed: {}", e))?;

    let mut subscribers = Vec::new();
    for row in rows.filter_map(|r| r.ok()) {
        let (id, email, name, engagement_score, total_opens, total_clicks, first_seen_at, last_seen_at) = row;

        // Get platform links
        let platforms = get_platform_links(&conn, &id);
        // Get tags
        let tags = get_subscriber_tags(&conn, &id);

        subscribers.push(UnifiedSubscriber {
            id,
            email,
            name,
            platforms,
            engagement_score,
            total_opens,
            total_clicks,
            first_seen_at,
            last_seen_at,
            tags,
        });
    }

    Ok(PaginatedSubscribers {
        subscribers,
        total,
        page,
        per_page,
    })
}

fn get_platform_links(conn: &rusqlite::Connection, subscriber_id: &str) -> Vec<PlatformLink> {
    let mut stmt = conn
        .prepare(
            "SELECT platform, account_id, status, subscribed_at FROM subscriber_platforms WHERE subscriber_id = ?1",
        )
        .unwrap();
    stmt.query_map(rusqlite::params![subscriber_id], |row| {
        Ok(PlatformLink {
            platform: row.get(0)?,
            account_id: row.get(1)?,
            status: row.get(2)?,
            subscribed_at: row.get(3)?,
        })
    })
    .unwrap()
    .filter_map(|r| r.ok())
    .collect()
}

fn get_subscriber_tags(conn: &rusqlite::Connection, subscriber_id: &str) -> Vec<String> {
    let mut stmt = conn
        .prepare("SELECT tag FROM subscriber_tags WHERE subscriber_id = ?1")
        .unwrap();
    stmt.query_map(rusqlite::params![subscriber_id], |row| row.get(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
}

#[tauri::command]
pub async fn get_subscriber_detail(
    app: AppHandle,
    id: String,
) -> Result<UnifiedSubscriber, String> {
    let conn = db::get_db(&app)?;

    let sub = conn
        .query_row(
            "SELECT id, email, name, engagement_score, total_opens, total_clicks, first_seen_at, last_seen_at
             FROM subscribers WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, f64>(3)?,
                    row.get::<_, i64>(4)?,
                    row.get::<_, i64>(5)?,
                    row.get::<_, String>(6)?,
                    row.get::<_, String>(7)?,
                ))
            },
        )
        .map_err(|_| "Subscriber not found".to_string())?;

    let (id, email, name, engagement_score, total_opens, total_clicks, first_seen_at, last_seen_at) = sub;
    let platforms = get_platform_links(&conn, &id);
    let tags = get_subscriber_tags(&conn, &id);

    Ok(UnifiedSubscriber {
        id,
        email,
        name,
        platforms,
        engagement_score,
        total_opens,
        total_clicks,
        first_seen_at,
        last_seen_at,
        tags,
    })
}

#[tauri::command]
pub async fn tag_subscribers(
    app: AppHandle,
    ids: Vec<String>,
    tag: String,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    for id in &ids {
        conn.execute(
            "INSERT OR IGNORE INTO subscriber_tags (subscriber_id, tag) VALUES (?1, ?2)",
            rusqlite::params![id, tag],
        ).ok();
    }
    Ok(())
}

#[tauri::command]
pub async fn untag_subscribers(
    app: AppHandle,
    ids: Vec<String>,
    tag: String,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    for id in &ids {
        conn.execute(
            "DELETE FROM subscriber_tags WHERE subscriber_id = ?1 AND tag = ?2",
            rusqlite::params![id, tag],
        ).ok();
    }
    Ok(())
}

#[tauri::command]
pub async fn get_audience_stats(app: AppHandle) -> Result<AudienceStats, String> {
    let conn = db::get_db(&app)?;

    let total_unique: i64 = conn
        .query_row("SELECT COUNT(*) FROM subscribers", [], |row| row.get(0))
        .unwrap_or(0);

    let thirty_days_ago = (Utc::now() - chrono::Duration::days(30)).to_rfc3339();
    let new_last_30d: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM subscribers WHERE first_seen_at >= ?1",
            rusqlite::params![thirty_days_ago],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let avg_engagement: f64 = conn
        .query_row(
            "SELECT COALESCE(AVG(engagement_score), 0.0) FROM subscribers",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // Platform breakdown
    let mut platform_stmt = conn
        .prepare("SELECT platform, COUNT(DISTINCT subscriber_id) FROM subscriber_platforms GROUP BY platform")
        .map_err(|e| format!("Query failed: {}", e))?;
    let platform_breakdown: Vec<PlatformCount> = platform_stmt
        .query_map([], |row| {
            Ok(PlatformCount {
                platform: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| format!("Query map failed: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    // Monthly growth (last 6 months)
    let six_months_ago = (Utc::now() - chrono::Duration::days(180)).to_rfc3339();
    let mut growth_stmt = conn
        .prepare(
            "SELECT strftime('%Y-%m', first_seen_at) as month, COUNT(*)
             FROM subscribers WHERE first_seen_at >= ?1
             GROUP BY month ORDER BY month ASC",
        )
        .map_err(|e| format!("Query failed: {}", e))?;
    let growth_data: Vec<GrowthPoint> = growth_stmt
        .query_map(rusqlite::params![six_months_ago], |row| {
            Ok(GrowthPoint {
                date: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| format!("Query map failed: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(AudienceStats {
        total_unique,
        new_last_30d,
        avg_engagement,
        platform_breakdown,
        growth_data,
    })
}

#[tauri::command]
pub async fn get_audience_segments(app: AppHandle) -> Result<Vec<Segment>, String> {
    let conn = db::get_db(&app)?;

    let thirty_days_ago = (Utc::now() - chrono::Duration::days(30)).to_rfc3339();
    let ninety_days_ago = (Utc::now() - chrono::Duration::days(90)).to_rfc3339();

    let new_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM subscribers WHERE first_seen_at >= ?1",
            rusqlite::params![thirty_days_ago],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let engaged_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM subscribers WHERE engagement_score >= 0.7",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let at_risk_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM subscribers WHERE last_seen_at < ?1 AND last_seen_at >= ?2",
            rusqlite::params![thirty_days_ago, ninety_days_ago],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let inactive_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM subscribers WHERE last_seen_at < ?1",
            rusqlite::params![ninety_days_ago],
            |row| row.get(0),
        )
        .unwrap_or(0);

    Ok(vec![
        Segment {
            name: "New".to_string(),
            description: "Subscribed in the last 30 days".to_string(),
            count: new_count,
            color: "#22c55e".to_string(),
        },
        Segment {
            name: "Highly Engaged".to_string(),
            description: "Engagement score above 70%".to_string(),
            count: engaged_count,
            color: "#3b82f6".to_string(),
        },
        Segment {
            name: "At Risk".to_string(),
            description: "No activity in 30-90 days".to_string(),
            count: at_risk_count,
            color: "#f59e0b".to_string(),
        },
        Segment {
            name: "Inactive".to_string(),
            description: "No activity in 90+ days".to_string(),
            count: inactive_count,
            color: "#ef4444".to_string(),
        },
    ])
}
