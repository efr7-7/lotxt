pub mod commands;
pub mod services;

use commands::credentials;
use commands::platform;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            credentials::store_credential,
            credentials::get_credential,
            credentials::delete_credential,
            credentials::list_credentials,
            platform::connect_platform,
            platform::disconnect_platform,
            platform::get_publications,
            platform::get_subscribers,
            platform::get_analytics,
            platform::publish_post,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
