use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageEntry {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub size: u64,
    pub created_at: String,
}

fn images_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let images_path = data_dir.join("images");
    if !images_path.exists() {
        fs::create_dir_all(&images_path).map_err(|e| format!("Failed to create images dir: {}", e))?;
    }
    Ok(images_path)
}

#[tauri::command]
pub async fn upload_image(app: AppHandle, file_path: String) -> Result<ImageEntry, String> {
    let source = PathBuf::from(&file_path);
    if !source.exists() {
        return Err("File not found".into());
    }

    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();

    let allowed = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
    if !allowed.contains(&ext.as_str()) {
        return Err(format!("Unsupported image format: .{}", ext));
    }

    let id = Uuid::new_v4().to_string();
    let filename = format!("{}.{}", id, ext);
    let dest_dir = images_dir(&app)?;
    let dest = dest_dir.join(&filename);

    fs::copy(&source, &dest).map_err(|e| format!("Failed to copy image: {}", e))?;

    let meta = fs::metadata(&dest).map_err(|e| format!("Failed to read metadata: {}", e))?;

    Ok(ImageEntry {
        id,
        filename,
        path: dest.to_string_lossy().to_string(),
        size: meta.len(),
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
pub async fn list_images(app: AppHandle) -> Result<Vec<ImageEntry>, String> {
    let dir = images_dir(&app)?;
    let mut entries = Vec::new();

    let read_dir = fs::read_dir(&dir).map_err(|e| format!("Failed to read images dir: {}", e))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Dir entry error: {}", e))?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        let allowed = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
        if !allowed.contains(&ext.as_str()) {
            continue;
        }

        let filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        // Extract ID from filename (uuid.ext)
        let id = filename
            .rsplit_once('.')
            .map(|(name, _)| name.to_string())
            .unwrap_or_else(|| filename.clone());

        let meta = fs::metadata(&path).unwrap_or_else(|_| fs::metadata(".").unwrap());

        entries.push(ImageEntry {
            id,
            filename,
            path: path.to_string_lossy().to_string(),
            size: meta.len(),
            created_at: meta
                .created()
                .ok()
                .and_then(|t| {
                    let dt: chrono::DateTime<chrono::Utc> = t.into();
                    Some(dt.to_rfc3339())
                })
                .unwrap_or_default(),
        });
    }

    // Sort by created_at descending (newest first)
    entries.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(entries)
}

#[tauri::command]
pub async fn delete_image(app: AppHandle, image_id: String) -> Result<(), String> {
    let dir = images_dir(&app)?;

    // Find the file matching this ID
    let read_dir = fs::read_dir(&dir).map_err(|e| format!("Failed to read images dir: {}", e))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Dir entry error: {}", e))?;
        let path = entry.path();
        let filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");

        if filename.starts_with(&image_id) {
            fs::remove_file(&path).map_err(|e| format!("Failed to delete image: {}", e))?;
            return Ok(());
        }
    }

    Err("Image not found".into())
}
