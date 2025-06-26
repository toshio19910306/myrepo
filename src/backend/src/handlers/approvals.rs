use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::json;
use validator::Validate;

use crate::{
    models::{ApprovalActionRequest, ApprovalHistoryResponse},
    services::approval_service,
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_approvals))
        .route("/:id/approve", post(approve))
        .route("/:id/reject", post(reject))
        .route("/:id/withdraw", post(withdraw))
        .route("/:id/history", get(get_approval_history))
}

async fn get_approvals(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "承認管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn approve(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
    Json(payload): Json<ApprovalActionRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    if let Err(errors) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "VALIDATION_ERROR",
                    "message": "入力値に誤りがあります",
                    "details": errors
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        ));
    }

    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "承認機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn reject(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
    Json(payload): Json<ApprovalActionRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    if let Err(errors) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "VALIDATION_ERROR",
                    "message": "入力値に誤りがあります",
                    "details": errors
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        ));
    }

    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "差し戻し機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn withdraw(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
    Json(payload): Json<ApprovalActionRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    if let Err(errors) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "VALIDATION_ERROR",
                    "message": "入力値に誤りがあります",
                    "details": errors
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        ));
    }

    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "取り戻し機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn get_approval_history(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<ApprovalHistoryResponse>>, (StatusCode, Json<ErrorResponse>)> {
    match approval_service::get_approval_history_by_id(_id).await {
        Ok(response) => Ok(Json(ApiResponse {
            success: true,
            data: Some(response),
            message: "承認履歴を取得しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "INTERNAL_ERROR",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}
