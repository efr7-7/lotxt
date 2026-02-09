use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::services::{beehiiv, kit, substack, PlatformService};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Publication {
    pub id: String,
    pub name: String,
    pub url: String,
    pub platform: String,
    pub subscriber_count: Option<u64>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subscriber {
    pub id: String,
    pub email: String,
    pub status: String,
    pub created_at: String,
    pub platform: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnalyticsData {
    pub total_subscribers: u64,
    pub open_rate: f64,
    pub click_rate: f64,
    pub subscriber_growth: Vec<GrowthPoint>,
    pub recent_posts: Vec<PostPerformance>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GrowthPoint {
    pub date: String,
    pub count: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PostPerformance {
    pub id: String,
    pub title: String,
    pub published_at: String,
    pub opens: u64,
    pub clicks: u64,
    pub unsubscribes: u64,
    pub platform: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublishRequest {
    pub title: String,
    pub html_content: String,
    pub subtitle: Option<String>,
    pub preview_text: Option<String>,
    pub status: String, // "draft" or "published"
}

fn get_api_key(app: &AppHandle, platform: &str, account_id: &str) -> Result<String, String> {
    let store = app.store("credentials.json").map_err(|e| e.to_string())?;
    let key = format!("{}:{}", platform, account_id);
    match store.get(&key) {
        Some(val) => {
            let cred: super::credentials::StoredCredential =
                serde_json::from_value(val.clone()).map_err(|e| e.to_string())?;
            Ok(cred.api_key)
        }
        None => Err(format!("No credentials found for {}:{}", platform, account_id)),
    }
}

#[tauri::command]
pub async fn connect_platform(
    app: AppHandle,
    platform: String,
    account_id: String,
) -> Result<bool, String> {
    let api_key = get_api_key(&app, &platform, &account_id)?;
    match platform.as_str() {
        "beehiiv" => beehiiv::BeehiivService::validate_connection(&api_key).await,
        "substack" => substack::SubstackService::validate_connection(&api_key).await,
        "kit" => kit::KitService::validate_connection(&api_key).await,
        _ => Err(format!("Unknown platform: {}", platform)),
    }
}

#[tauri::command]
pub async fn disconnect_platform(
    app: AppHandle,
    platform: String,
    account_id: String,
) -> Result<(), String> {
    let store = app.store("credentials.json").map_err(|e| e.to_string())?;
    let key = format!("{}:{}", platform, account_id);
    store.delete(&key).map_err(|e| e.to_string())?;
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_publications(
    app: AppHandle,
    platform: String,
    account_id: String,
) -> Result<Vec<Publication>, String> {
    let api_key = get_api_key(&app, &platform, &account_id)?;
    match platform.as_str() {
        "beehiiv" => beehiiv::BeehiivService::get_publications(&api_key).await,
        "substack" => substack::SubstackService::get_publications(&api_key).await,
        "kit" => kit::KitService::get_publications(&api_key).await,
        _ => Err(format!("Unknown platform: {}", platform)),
    }
}

#[tauri::command]
pub async fn get_subscribers(
    app: AppHandle,
    platform: String,
    account_id: String,
    publication_id: Option<String>,
) -> Result<Vec<Subscriber>, String> {
    let api_key = get_api_key(&app, &platform, &account_id)?;
    match platform.as_str() {
        "beehiiv" => {
            beehiiv::BeehiivService::get_subscribers(&api_key, publication_id.as_deref()).await
        }
        "substack" => {
            substack::SubstackService::get_subscribers(&api_key, publication_id.as_deref()).await
        }
        "kit" => kit::KitService::get_subscribers(&api_key, publication_id.as_deref()).await,
        _ => Err(format!("Unknown platform: {}", platform)),
    }
}

#[tauri::command]
pub async fn get_analytics(
    app: AppHandle,
    platform: String,
    account_id: String,
    publication_id: Option<String>,
) -> Result<AnalyticsData, String> {
    let api_key = get_api_key(&app, &platform, &account_id)?;
    match platform.as_str() {
        "beehiiv" => {
            beehiiv::BeehiivService::get_analytics(&api_key, publication_id.as_deref()).await
        }
        "substack" => {
            substack::SubstackService::get_analytics(&api_key, publication_id.as_deref()).await
        }
        "kit" => kit::KitService::get_analytics(&api_key, publication_id.as_deref()).await,
        _ => Err(format!("Unknown platform: {}", platform)),
    }
}

#[tauri::command]
pub async fn publish_post(
    app: AppHandle,
    platform: String,
    account_id: String,
    publication_id: String,
    request: PublishRequest,
) -> Result<String, String> {
    let api_key = get_api_key(&app, &platform, &account_id)?;
    match platform.as_str() {
        "beehiiv" => {
            beehiiv::BeehiivService::publish(&api_key, &publication_id, request).await
        }
        "substack" => {
            substack::SubstackService::publish(&api_key, &publication_id, request).await
        }
        "kit" => kit::KitService::publish(&api_key, &publication_id, request).await,
        _ => Err(format!("Unknown platform: {}", platform)),
    }
}
