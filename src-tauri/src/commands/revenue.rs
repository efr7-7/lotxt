use crate::db;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RevenueEntry {
    pub id: String,
    pub source: String,
    pub amount_cents: i64,
    pub currency: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub subscriber_email: Option<String>,
    pub description: Option<String>,
    pub period_start: Option<String>,
    pub period_end: Option<String>,
    pub recorded_at: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RevenueStats {
    pub mrr: i64,
    pub arr: i64,
    pub total_revenue: i64,
    pub avg_per_subscriber: f64,
    pub monthly_data: Vec<MonthlyRevenue>,
    pub source_breakdown: Vec<SourceRevenue>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonthlyRevenue {
    pub month: String,
    pub amount_cents: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SourceRevenue {
    pub source: String,
    pub amount_cents: i64,
}

#[tauri::command]
pub async fn add_revenue_entry(
    app: AppHandle,
    source: String,
    amount_cents: i64,
    currency: Option<String>,
    entry_type: Option<String>,
    subscriber_email: Option<String>,
    description: Option<String>,
    period_start: Option<String>,
    period_end: Option<String>,
    recorded_at: Option<String>,
) -> Result<String, String> {
    let conn = db::get_db(&app)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let recorded = recorded_at.unwrap_or_else(|| now.clone());
    let curr = currency.unwrap_or_else(|| "USD".to_string());
    let etype = entry_type.unwrap_or_else(|| "recurring".to_string());

    conn.execute(
        "INSERT INTO revenue_entries (id, source, amount_cents, currency, type, subscriber_email, description, period_start, period_end, recorded_at, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        rusqlite::params![id, source, amount_cents, curr, etype, subscriber_email, description, period_start, period_end, recorded, now],
    )
    .map_err(|e| format!("Failed to add revenue entry: {}", e))?;

    db::log_activity(
        &conn,
        "revenue.added",
        "revenue",
        Some(&id),
        Some(&format!("{} {} cents from {}", etype, amount_cents, source)),
    );

    Ok(id)
}

#[tauri::command]
pub async fn list_revenue_entries(
    app: AppHandle,
    from: Option<String>,
    to: Option<String>,
    source: Option<String>,
) -> Result<Vec<RevenueEntry>, String> {
    let conn = db::get_db(&app)?;

    let mut sql = String::from(
        "SELECT id, source, amount_cents, currency, type, subscriber_email, description, period_start, period_end, recorded_at, created_at
         FROM revenue_entries WHERE 1=1",
    );
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref f) = from {
        sql.push_str(&format!(" AND recorded_at >= ?{}", params.len() + 1));
        params.push(Box::new(f.clone()));
    }
    if let Some(ref t) = to {
        sql.push_str(&format!(" AND recorded_at <= ?{}", params.len() + 1));
        params.push(Box::new(t.clone()));
    }
    if let Some(ref s) = source {
        sql.push_str(&format!(" AND source = ?{}", params.len() + 1));
        params.push(Box::new(s.clone()));
    }

    sql.push_str(" ORDER BY recorded_at DESC LIMIT 500");

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| format!("Query failed: {}", e))?;
    let rows = stmt
        .query_map(param_refs.as_slice(), |row| {
            Ok(RevenueEntry {
                id: row.get(0)?,
                source: row.get(1)?,
                amount_cents: row.get(2)?,
                currency: row.get(3)?,
                entry_type: row.get(4)?,
                subscriber_email: row.get(5)?,
                description: row.get(6)?,
                period_start: row.get(7)?,
                period_end: row.get(8)?,
                recorded_at: row.get(9)?,
                created_at: row.get(10)?,
            })
        })
        .map_err(|e| format!("Query map failed: {}", e))?;

    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub async fn get_revenue_stats(
    app: AppHandle,
    from: Option<String>,
    to: Option<String>,
) -> Result<RevenueStats, String> {
    let conn = db::get_db(&app)?;

    let now = Utc::now();
    let month_start = format!("{}-{:02}-01T00:00:00Z", now.format("%Y"), now.format("%m"));
    let from_date = from.unwrap_or_else(|| (now - chrono::Duration::days(365)).to_rfc3339());
    let to_date = to.unwrap_or_else(|| now.to_rfc3339());

    // MRR: sum of recurring entries in current month
    let mrr: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount_cents), 0) FROM revenue_entries WHERE type = 'recurring' AND recorded_at >= ?1",
            rusqlite::params![month_start],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let arr = mrr * 12;

    // Total in range
    let total_revenue: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(CASE WHEN type != 'refund' THEN amount_cents ELSE -amount_cents END), 0)
             FROM revenue_entries WHERE recorded_at >= ?1 AND recorded_at <= ?2",
            rusqlite::params![from_date, to_date],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Avg per subscriber
    let sub_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM subscribers", [], |row| row.get(0))
        .unwrap_or(1)
        .max(1);
    let avg_per_subscriber = total_revenue as f64 / sub_count as f64;

    // Monthly breakdown
    let mut monthly_stmt = conn
        .prepare(
            "SELECT strftime('%Y-%m', recorded_at) as month,
                    SUM(CASE WHEN type != 'refund' THEN amount_cents ELSE -amount_cents END)
             FROM revenue_entries
             WHERE recorded_at >= ?1 AND recorded_at <= ?2
             GROUP BY month ORDER BY month ASC",
        )
        .map_err(|e| format!("Query failed: {}", e))?;
    let monthly_data: Vec<MonthlyRevenue> = monthly_stmt
        .query_map(rusqlite::params![from_date, to_date], |row| {
            Ok(MonthlyRevenue {
                month: row.get(0)?,
                amount_cents: row.get(1)?,
            })
        })
        .map_err(|e| format!("Query map failed: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    // Source breakdown
    let mut source_stmt = conn
        .prepare(
            "SELECT source, SUM(amount_cents) FROM revenue_entries
             WHERE recorded_at >= ?1 AND recorded_at <= ?2 AND type != 'refund'
             GROUP BY source ORDER BY SUM(amount_cents) DESC",
        )
        .map_err(|e| format!("Query failed: {}", e))?;
    let source_breakdown: Vec<SourceRevenue> = source_stmt
        .query_map(rusqlite::params![from_date, to_date], |row| {
            Ok(SourceRevenue {
                source: row.get(0)?,
                amount_cents: row.get(1)?,
            })
        })
        .map_err(|e| format!("Query map failed: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(RevenueStats {
        mrr,
        arr,
        total_revenue,
        avg_per_subscriber,
        monthly_data,
        source_breakdown,
    })
}

#[tauri::command]
pub async fn delete_revenue_entry(app: AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    conn.execute(
        "DELETE FROM revenue_entries WHERE id = ?1",
        rusqlite::params![id],
    )
    .map_err(|e| format!("Failed to delete: {}", e))?;
    Ok(())
}
