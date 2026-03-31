mod commands;
mod models;
mod store;

use commands::{create_request, delete_request, execute_request, list_requests, update_request};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_requests,
            create_request,
            update_request,
            delete_request,
            execute_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
