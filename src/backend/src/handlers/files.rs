use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post},
    Router,
};
use serde_json::json;

use crate::{
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/upload", post(upload_file))
        .route("/:id/download", get(download_file))
        .route("/:id", delete(delete_file))
}

async fn upload_file(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "ファイルアップロード機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn download_file(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "ファイルダウンロード機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn delete_file(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "ファイル削除機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}
