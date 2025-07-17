use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use serde::Deserialize;
use serde_json::json;

use crate::{
    services::user_service_impl,
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct UserQuery {
    pub user_type: Option<String>,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_users))
        .route("/approvers", get(get_approvers))
}

async fn get_users(
    State(state): State<AppState>,
    Query(query): Query<UserQuery>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match user_service_impl::get_users_by_type(&state.db_pool, query.user_type).await {
        Ok(users) => {
            let user_data: Vec<serde_json::Value> = users
                .into_iter()
                .map(|u| serde_json::json!({
                    "user_id": u.user_id,
                    "username": u.username,
                    "email": u.email,
                    "full_name": u.full_name,
                    "department": u.department,
                    "position": u.position,
                    "user_type": u.user_type,
                    "company_name": u.company_name,
                    "is_active": u.is_active,
                    "created_at": u.created_at,
                    "updated_at": u.updated_at
                }))
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(user_data),
                message: "ユーザー一覧を取得しました".to_string(),
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

async fn get_approvers(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match user_service_impl::get_users_by_type(&state.db_pool, None).await {
        Ok(users) => {
            let user_data: Vec<serde_json::Value> = users
                .into_iter()
                .filter(|u| {
                    let valid_user_type = matches!(u.user_type.as_str(), "IT" | "ADMIN");
                    let valid_position = u.position.as_ref().map_or(false, |pos| 
                        pos.contains("部長") || pos.contains("課長") || pos.contains("係長")
                    );
                    valid_user_type && valid_position && u.is_active
                })
                .map(|u| serde_json::json!({
                    "user_id": u.user_id,
                    "username": u.username,
                    "email": u.email,
                    "full_name": u.full_name,
                    "department": u.department,
                    "position": u.position,
                    "user_type": u.user_type,
                    "company_name": u.company_name,
                    "is_active": u.is_active,
                    "created_at": u.created_at,
                    "updated_at": u.updated_at
                }))
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(user_data),
                message: "承認者一覧を取得しました".to_string(),
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
