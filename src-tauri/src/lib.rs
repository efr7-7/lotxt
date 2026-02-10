pub mod commands;
pub mod db;
pub mod scheduler;
pub mod services;

use tauri::Manager;
use commands::ai;
use commands::audience;
use commands::credentials;
use commands::export;
use commands::images;
use commands::platform;
use commands::revenue;
use commands::scheduler as scheduler_cmds;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize SQLite database
            let db_state =
                db::init_db(&app.handle()).expect("Failed to initialize database");
            app.manage(db_state);

            // Start background scheduler
            scheduler::start_scheduler(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Credentials
            credentials::store_credential,
            credentials::get_credential,
            credentials::delete_credential,
            credentials::list_credentials,
            // Platform
            platform::connect_platform,
            platform::disconnect_platform,
            platform::get_publications,
            platform::get_subscribers,
            platform::get_analytics,
            platform::publish_post,
            platform::import_posts,
            platform::post_tweet,
            platform::post_thread,
            platform::post_linkedin,
            // Export / Documents
            export::export_docx,
            export::export_pdf,
            export::save_document,
            export::load_document,
            export::list_documents,
            export::delete_document,
            export::auto_save,
            // Projects
            export::create_project,
            export::list_projects,
            export::update_project,
            export::delete_project,
            export::move_document_to_project,
            export::set_document_status,
            export::add_document_tags,
            export::remove_document_tag,
            // Document versions
            export::get_document_versions,
            export::restore_document_version,
            // Activity
            export::get_recent_activity,
            // Scheduler
            scheduler_cmds::schedule_post,
            scheduler_cmds::list_scheduled_posts,
            scheduler_cmds::cancel_scheduled_post,
            scheduler_cmds::reschedule_post,
            scheduler_cmds::publish_scheduled_now,
            scheduler_cmds::get_calendar_events,
            // Audience
            audience::sync_subscribers,
            audience::get_unified_subscribers,
            audience::get_subscriber_detail,
            audience::tag_subscribers,
            audience::untag_subscribers,
            audience::get_audience_stats,
            audience::get_audience_segments,
            // Revenue
            revenue::add_revenue_entry,
            revenue::list_revenue_entries,
            revenue::get_revenue_stats,
            revenue::delete_revenue_entry,
            // Templates
            export::save_user_template,
            export::list_user_templates,
            export::delete_user_template,
            export::increment_template_usage,
            // AI
            ai::save_ai_provider,
            ai::get_ai_providers,
            ai::delete_ai_provider,
            ai::ai_chat,
            ai::ai_chat_stream,
            // Images
            images::upload_image,
            images::list_images,
            images::delete_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
