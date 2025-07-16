use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::{json, Value};
use validator::Validate;

use crate::{
    // models::{LoginRequest, LoginResponse, UserResponse},
    services::auth_service,
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/login", post(login))
        .route("/logout", post(logout))
        .route("/me", get(get_current_user))
        .route("/refresh", post(refresh_token))
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<ApiResponse<LoginResponse>>, (StatusCode, Json<ErrorResponse>)> {
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

    match auth_service::authenticate_user(&state.db_pool, &payload.username, &payload.password).await {
        Ok(login_response) => Ok(Json(ApiResponse {
            success: true,
            data: Some(login_response),
            message: "ログインに成功しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Err(e) => Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "AUTHENTICATION_FAILED",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn logout(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Value>>, (StatusCode, Json<ErrorResponse>)> {
    Ok(Json(ApiResponse {
        success: true,
        data: Some(json!({})),
        message: "ログアウトしました".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn get_current_user(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<UserResponse>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "認証機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn refresh_token(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<LoginResponse>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "トークンリフレッシュ機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}
