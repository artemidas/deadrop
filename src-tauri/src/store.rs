use std::path::PathBuf;
use tauri::Manager;

use crate::models::SavedRequest;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Default)]
pub struct RequestStore {
    pub requests: Vec<SavedRequest>,
}

pub fn get_store_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("requests.json"))
}

pub fn load_store(app: &tauri::AppHandle) -> Result<RequestStore, String> {
    let path = get_store_path(app)?;
    if !path.exists() {
        return Ok(RequestStore::default());
    }
    let data = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

pub fn save_store(app: &tauri::AppHandle, store: &RequestStore) -> Result<(), String> {
    let path = get_store_path(app)?;
    let data = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;
    std::fs::write(&path, data).map_err(|e| e.to_string())
}

pub fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}
