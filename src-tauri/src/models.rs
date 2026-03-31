use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
