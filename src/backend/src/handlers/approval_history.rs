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
    models::{ApprovalHistoryQuery, ApprovalHistoryResponse, ApprovalHistoryItem, ApprovalHistoryUser, ApprovalHistoryTarget, PaginationInfo},
    services::approval_service,
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_approval_history))
}

async fn get_approval_history(
    State(state): State<AppState>,
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

    match approval_service::get_approval_history(&state.db_pool, query.target_id.unwrap_or(1)).await {
        Ok(history_items) => {
            let response = ApprovalHistoryResponse {
                approval_history: history_items.into_iter().map(|h| ApprovalHistoryItem {
                    id: h.history_id,
                    action_type: h.action,
                    processed_at: h.created_at,
                    user: ApprovalHistoryUser {
                        full_name: "Unknown User".to_string(),
                        department: None,
                        position: None,
                    },
                    comments: h.comments,
                    target: ApprovalHistoryTarget {
                        r#type: "estimate_request".to_string(),
                        id: h.flow_id,
                        title: "Estimate Request".to_string(),
                    },
                }).collect(),
                pagination: PaginationInfo {
                    current_page: query.page.unwrap_or(1),
                    per_page: query.per_page.unwrap_or(20),
                    total_count: 0,
                    total_pages: 1,
                },
            };
            Ok(Json(ApiResponse {
                success: true,
                data: Some(response),
                message: "承認履歴を取得しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        },
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
