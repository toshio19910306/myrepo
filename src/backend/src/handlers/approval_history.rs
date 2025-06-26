use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use serde_json::json;
use validator::Validate;

use crate::{
    models::{ApprovalHistoryQuery, ApprovalHistoryResponse},
    services::approval_history_service,
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_approval_history))
}

async fn get_approval_history(
    State(_state): State<AppState>,
    Query(query): Query<ApprovalHistoryQuery>,
) -> Result<Json<ApiResponse<ApprovalHistoryResponse>>, (StatusCode, Json<ErrorResponse>)> {
    if let Err(errors) = query.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "VALIDATION_ERROR",
                    "message": "クエリパラメータに誤りがあります",
                    "details": errors
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        ));
    }

    match approval_history_service::get_approval_history(query).await {
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
