use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StoredCredential {
    pub platform: String,
    pub account_id: String,
    pub api_key: String,
    pub account_name: String,
    pub email: String,
}

#[tauri::command]
pub async fn store_credential(
    app: AppHandle,
    platform: String,
    account_id: String,
    api_key: String,
    account_name: String,
    email: String,
) -> Result<(), String> {
    let store = app.store("credentials.json").map_err(|e| e.to_string())?;
    let key = format!("{}:{}", platform, account_id);
    let cred = StoredCredential {
        platform,
        account_id,
        api_key,
        account_name,
        email,
    };
    store.set(
        &key,
        serde_json::to_value(&cred).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_credential(
    app: AppHandle,
    platform: String,
    account_id: String,
) -> Result<Option<StoredCredential>, String> {
    let store = app.store("credentials.json").map_err(|e| e.to_string())?;
    let key = format!("{}:{}", platform, account_id);
    match store.get(&key) {
        Some(val) => {
            let cred: StoredCredential =
                serde_json::from_value(val.clone()).map_err(|e| e.to_string())?;
            Ok(Some(cred))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn delete_credential(
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
pub async fn list_credentials(app: AppHandle) -> Result<Vec<StoredCredential>, String> {
    let store = app.store("credentials.json").map_err(|e| e.to_string())?;
    let mut creds = Vec::new();
    for (_, value) in store.entries() {
        if let Ok(cred) = serde_json::from_value::<StoredCredential>(value.clone()) {
            creds.push(cred);
        }
    }
    Ok(creds)
}
