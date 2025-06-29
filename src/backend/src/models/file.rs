use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AttachedFile {
    pub file_id: Uuid,
    pub target_type: String,
    pub target_id: i32,
    pub original_filename: String,
    pub stored_filename: String,
    pub file_size: i64,
    pub content_type: String,
    pub blob_url: String,
    pub uploaded_by: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileUploadResponse {
    pub file_id: Uuid,
    pub filename: String,
    pub size: i64,
    pub content_type: String,
    pub url: String,
}
