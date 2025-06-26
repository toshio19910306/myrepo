use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put},
    Router,
};
use serde_json::json;

use crate::{
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_responses).post(create_response))
        .route("/:id", get(get_response).put(update_response))
        .route("/:id/submit", post(submit_response))
}

async fn get_responses(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積回答管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn get_response(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積回答管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn create_response(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積回答管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn update_response(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積回答管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn submit_response(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "見積回答管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}
