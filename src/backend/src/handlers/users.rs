use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde::Deserialize;
use serde_json::json;

use crate::{
    services::{user_service_impl, user_service},
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct UserQuery {
    pub user_type: Option<String>,
    pub page: Option<i32>,
    pub limit: Option<i32>,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_users).post(create_user))
        .route("/:id", get(get_user_by_id).put(update_user).delete(delete_user))
        .route("/approvers", get(get_approvers))
}

async fn get_users(
    State(state): State<AppState>,
    Query(query): Query<UserQuery>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(50);

    match user_service::get_all_users(&state.db_pool, page, limit).await {
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

async fn get_user_by_id(
    State(state): State<AppState>,
    Path(user_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match user_service::get_user_by_id(&state.db_pool, user_id).await {
        Ok(Some(user)) => {
            let user_data = json!({
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "department": user.department,
                "position": user.position,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            });
            Ok(Json(ApiResponse {
                success: true,
                data: Some(user_data),
                message: "ユーザー詳細を取得しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        },
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "USER_NOT_FOUND", "message": "ユーザーが見つかりません"}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "INTERNAL_ERROR", "message": e.to_string()}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn update_user(
    State(state): State<AppState>,
    Path(user_id): Path<i32>,
    Json(request): Json<user_service::UpdateUserRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match user_service::update_user(&state.db_pool, user_id, request).await {
        Ok(Some(user)) => {
            let user_data = json!({
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "department": user.department,
                "position": user.position,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            });
            Ok(Json(ApiResponse {
                success: true,
                data: Some(user_data),
                message: "ユーザー情報を更新しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        },
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "USER_NOT_FOUND", "message": "ユーザーが見つかりません"}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "INTERNAL_ERROR", "message": e.to_string()}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn delete_user(
    State(state): State<AppState>,
    Path(user_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match user_service::delete_user(&state.db_pool, user_id).await {
        Ok(true) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({"user_id": user_id})),
            message: "ユーザーを削除しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(false) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "USER_NOT_FOUND", "message": "ユーザーが見つかりません"}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "INTERNAL_ERROR", "message": e.to_string()}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn get_approvers(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match user_service::get_users_by_type(&state.db_pool, None).await {
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

async fn create_user(
    State(state): State<AppState>,
    Json(request): Json<user_service::CreateUserRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match user_service::create_user(&state.db_pool, request).await {
        Ok(user) => {
            let user_data = serde_json::json!({
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "department": user.department,
                "position": user.position,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            });

            Ok(Json(ApiResponse {
                success: true,
                data: Some(user_data),
                message: "ユーザーが正常に作成されました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        },
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "USER_CREATION_FAILED",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}
