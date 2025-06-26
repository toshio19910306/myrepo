use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde_json::json;

use crate::{
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_requests).post(create_request))
        .route("/:id", get(get_request).put(update_request).delete(delete_request))
        .route("/:id/submit", post(submit_request))
        .route("/:id/copy", post(copy_request))
}

async fn get_requests(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積依頼管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn get_request(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積依頼管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn create_request(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積依頼管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn update_request(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積依頼管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn delete_request(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積依頼管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn submit_request(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積依頼管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn copy_request(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積依頼管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}
