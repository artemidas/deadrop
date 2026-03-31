use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::Instant;
use tauri::Manager;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedRequest {
    pub id: String,
    pub name: String,
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    #[serde(default)]
    pub params: HashMap<String, String>,
    pub body: Option<String>,
    pub last_response: Option<HttpResponse>,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub elapsed_ms: u128,
    pub size_bytes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct RequestStore {
    requests: Vec<SavedRequest>,
}

fn get_store_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("requests.json"))
}

fn load_store(app: &tauri::AppHandle) -> Result<RequestStore, String> {
    let path = get_store_path(app)?;
    if !path.exists() {
        return Ok(RequestStore::default());
    }
    let data = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

fn save_store(app: &tauri::AppHandle, store: &RequestStore) -> Result<(), String> {
    let path = get_store_path(app)?;
    let data = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;
    std::fs::write(&path, data).map_err(|e| e.to_string())
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}

#[tauri::command]
async fn list_requests(app: tauri::AppHandle) -> Result<Vec<SavedRequest>, String> {
    let store = load_store(&app)?;
    Ok(store.requests)
}

#[tauri::command]
async fn create_request(
    app: tauri::AppHandle,
    name: String,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    params: HashMap<String, String>,
    body: Option<String>,
) -> Result<SavedRequest, String> {
    let mut store = load_store(&app)?;
    let now = now_ms();
    let req = SavedRequest {
        id: Uuid::new_v4().to_string(),
        name,
        method,
        url,
        headers,
        params,
        body,
        last_response: None,
        created_at: now,
        updated_at: now,
    };
    store.requests.push(req.clone());
    save_store(&app, &store)?;
    Ok(req)
}

#[tauri::command]
async fn update_request(
    app: tauri::AppHandle,
    id: String,
    name: String,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    params: HashMap<String, String>,
    body: Option<String>,
) -> Result<SavedRequest, String> {
    let mut store = load_store(&app)?;
    let req = store
        .requests
        .iter_mut()
        .find(|r| r.id == id)
        .ok_or("Request not found")?;
    req.name = name;
    req.method = method;
    req.url = url;
    req.headers = headers;
    req.params = params;
    req.body = body;
    req.updated_at = now_ms();
    let updated = req.clone();
    save_store(&app, &store)?;
    Ok(updated)
}

#[tauri::command]
async fn delete_request(app: tauri::AppHandle, id: String) -> Result<bool, String> {
    let mut store = load_store(&app)?;
    let len_before = store.requests.len();
    store.requests.retain(|r| r.id != id);
    if store.requests.len() == len_before {
        return Ok(false);
    }
    save_store(&app, &store)?;
    Ok(true)
}

#[tauri::command]
async fn execute_request(
    app: tauri::AppHandle,
    id: Option<String>,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    params: HashMap<String, String>,
    body: Option<String>,
) -> Result<HttpResponse, String> {
    let client = Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let method: reqwest::Method = method.parse().map_err(|_| "Invalid HTTP method")?;

    let mut req_builder = client.request(method, &url);

    let query_params: Vec<(&String, &String)> = params
        .iter()
        .filter(|(k, _)| !k.is_empty())
        .collect();
    if !query_params.is_empty() {
        req_builder = req_builder.query(&query_params);
    }

    for (k, v) in &headers {
        if !k.is_empty() {
            req_builder = req_builder.header(k, v);
        }
    }

    if let Some(b) = &body {
        if !b.is_empty() {
            req_builder = req_builder.body(b.clone());
        }
    }

    let start = Instant::now();
    let resp = req_builder.send().await.map_err(|e| e.to_string())?;
    let elapsed = start.elapsed().as_millis();

    let status = resp.status().as_u16();
    let status_text = resp
        .status()
        .canonical_reason()
        .unwrap_or("")
        .to_string();

    let resp_headers: HashMap<String, String> = resp
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();

    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    let size_bytes = bytes.len();
    let body_text = String::from_utf8_lossy(&bytes).to_string();

    let http_response = HttpResponse {
        status,
        status_text,
        headers: resp_headers,
        body: body_text,
        elapsed_ms: elapsed,
        size_bytes,
    };

    if let Some(req_id) = id {
        if let Ok(mut store) = load_store(&app) {
            if let Some(req) = store.requests.iter_mut().find(|r| r.id == req_id) {
                req.last_response = Some(http_response.clone());
                req.updated_at = now_ms();
                let _ = save_store(&app, &store);
            }
        }
    }

    Ok(http_response)
}

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
