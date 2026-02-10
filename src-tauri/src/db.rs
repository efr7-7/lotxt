use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

// ---------------------------------------------------------------------------
// State wrapper
// ---------------------------------------------------------------------------

pub struct DbState {
    pub conn: Mutex<Connection>,
}

/// Helper to get a lock on the database connection from any command.
/// Callers should use `let conn = db::get_db(&app)?;` — the returned guard
/// is valid for as long as the AppHandle's managed state is alive.
pub fn get_db(app: &tauri::AppHandle) -> Result<std::sync::MutexGuard<'static, Connection>, String> {
    let state: tauri::State<'_, DbState> = app.state::<DbState>();
    // SAFETY: DbState is managed for the entire lifetime of the app.
    // The Mutex and its Connection live as long as the Tauri app process,
    // which is effectively 'static for our purposes.
    let mutex: &'static Mutex<Connection> = unsafe {
        &*(&state.conn as *const Mutex<Connection>)
    };
    mutex
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/// Opens (or creates) station.db inside app_data_dir, runs all migrations,
/// and returns the managed state.
pub fn init_db(app: &tauri::AppHandle) -> Result<DbState, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;

    if !base.exists() {
        fs::create_dir_all(&base)
            .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }

    let db_path = base.join("station.db");
    let conn =
        Connection::open(&db_path).map_err(|e| format!("Failed to open database: {}", e))?;

    // WAL mode for better concurrency
    conn.execute_batch("PRAGMA journal_mode=WAL;")
        .map_err(|e| format!("Failed to set WAL mode: {}", e))?;

    // Run migrations
    run_migrations(&conn)?;

    // Migrate from .stn files if needed
    migrate_from_files(&conn, &base)?;

    Ok(DbState {
        conn: Mutex::new(conn),
    })
}

// ---------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------

fn run_migrations(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );",
    )
    .map_err(|e| format!("Failed to create migrations table: {}", e))?;

    let current_version: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM _migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if current_version < 1 {
        conn.execute_batch(MIGRATION_001)
            .map_err(|e| format!("Migration 001 failed: {}", e))?;
        conn.execute(
            "INSERT INTO _migrations (version, applied_at) VALUES (1, datetime('now'))",
            [],
        )
        .map_err(|e| format!("Failed to record migration 001: {}", e))?;
    }

    Ok(())
}

const MIGRATION_001: &str = "
-- Core: Documents
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    html_content TEXT NOT NULL DEFAULT '',
    project_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    scheduled_at TEXT,
    published_at TEXT,
    word_count INTEGER NOT NULL DEFAULT 0,
    character_count INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Core: Document versions (for history)
CREATE TABLE IF NOT EXISTS document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL
);

-- Core: Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#7c3aed',
    icon TEXT NOT NULL DEFAULT 'folder',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Core: Document tags
CREATE TABLE IF NOT EXISTS document_tags (
    document_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (document_id, tag)
);

-- Scheduling
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    account_id TEXT NOT NULL,
    publication_id TEXT,
    title TEXT NOT NULL DEFAULT '',
    scheduled_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    published_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scheduled_time ON scheduled_posts(scheduled_at, status);

-- Audience: Unified subscribers
CREATE TABLE IF NOT EXISTS subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    engagement_score REAL NOT NULL DEFAULT 0.0,
    total_opens INTEGER NOT NULL DEFAULT 0,
    total_clicks INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriber_platforms (
    subscriber_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    platform_subscriber_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    subscribed_at TEXT,
    PRIMARY KEY (subscriber_id, platform, account_id)
);

CREATE TABLE IF NOT EXISTS subscriber_tags (
    subscriber_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (subscriber_id, tag)
);

-- Revenue
CREATE TABLE IF NOT EXISTS revenue_entries (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    type TEXT NOT NULL DEFAULT 'recurring',
    subscriber_email TEXT,
    description TEXT,
    period_start TEXT,
    period_end TEXT,
    recorded_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_entries(recorded_at);

-- Templates
CREATE TABLE IF NOT EXISTS user_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    thumbnail TEXT NOT NULL DEFAULT '',
    elements_json TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_builtin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_log(created_at DESC);
";

// ---------------------------------------------------------------------------
// File migration (.stn → SQLite)
// ---------------------------------------------------------------------------

#[derive(serde::Deserialize)]
struct LegacyDocument {
    #[allow(dead_code)]
    version: Option<String>,
    id: String,
    title: String,
    content: String,
    html_content: String,
    created_at: String,
    updated_at: String,
}

fn migrate_from_files(conn: &Connection, base: &PathBuf) -> Result<(), String> {
    let docs_dir = base.join("documents");
    if !docs_dir.exists() {
        return Ok(());
    }

    // Check if we already migrated
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM documents", [], |row| row.get(0))
        .unwrap_or(0);

    let entries = fs::read_dir(&docs_dir).map_err(|e| format!("Cannot read documents dir: {}", e))?;
    let mut stn_files: Vec<_> = Vec::new();

    for entry in entries {
        if let Ok(entry) = entry {
            if entry.path().extension().and_then(|e| e.to_str()) == Some("stn") {
                stn_files.push(entry.path());
            }
        }
    }

    if stn_files.is_empty() || count > 0 {
        return Ok(());
    }

    // Migrate each .stn file
    let backup_dir = base.join("documents_backup");
    if !backup_dir.exists() {
        fs::create_dir_all(&backup_dir)
            .map_err(|e| format!("Failed to create backup dir: {}", e))?;
    }

    for path in &stn_files {
        if let Ok(contents) = fs::read_to_string(path) {
            if let Ok(doc) = serde_json::from_str::<LegacyDocument>(&contents) {
                let word_count = count_words_simple(&doc.html_content);
                conn.execute(
                    "INSERT OR IGNORE INTO documents (id, title, content, html_content, status, word_count, character_count, version, created_at, updated_at)
                     VALUES (?1, ?2, ?3, ?4, 'draft', ?5, 0, 1, ?6, ?7)",
                    rusqlite::params![
                        doc.id,
                        doc.title,
                        doc.content,
                        doc.html_content,
                        word_count,
                        doc.created_at,
                        doc.updated_at,
                    ],
                )
                .ok();

                // Move to backup
                if let Some(filename) = path.file_name() {
                    let _ = fs::rename(path, backup_dir.join(filename));
                }
            }
        }
    }

    Ok(())
}

fn count_words_simple(html: &str) -> i64 {
    let mut in_tag = false;
    let mut text = String::new();
    for ch in html.chars() {
        if ch == '<' {
            in_tag = true;
            text.push(' ');
        } else if ch == '>' {
            in_tag = false;
        } else if !in_tag {
            text.push(ch);
        }
    }
    text.split_whitespace().count() as i64
}

// ---------------------------------------------------------------------------
// Activity logging helper
// ---------------------------------------------------------------------------

pub fn log_activity(
    conn: &Connection,
    action: &str,
    entity_type: &str,
    entity_id: Option<&str>,
    details: Option<&str>,
) {
    let now = chrono::Utc::now().to_rfc3339();
    let _ = conn.execute(
        "INSERT INTO activity_log (action, entity_type, entity_id, details, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![action, entity_type, entity_id, details, now],
    );
}
