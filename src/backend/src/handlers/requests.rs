use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde_json::json;
use validator::Validate;

use crate::{
    models::{CreateEstimateRequestRequest, UpdateEstimateRequestRequest},
    services::estimate_request_service,
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_requests).post(create_request))
        .route("/approved", get(get_approved_requests))
        .route("/:id", get(get_request).put(update_request).delete(delete_request))
        .route("/:id/submit", post(submit_request))
        .route("/:id/copy", post(copy_request))
}

async fn get_requests(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    let page = 1;
    let per_page = 20;
    match estimate_request_service::get_all_requests(&state.db_pool, page, per_page).await {
        Ok(requests) => {
            let request_data: Vec<serde_json::Value> = requests
                .into_iter()
                .map(|r| serde_json::json!({
                    "request_id": r.request_id,
                    "spec_id": r.spec_id,
                    "subject": r.subject,
                    "description": r.description,
                    "deadline": r.deadline,
                    "budget_range_min": r.budget_range_min,
                    "budget_range_max": r.budget_range_max,
                    "requirements": r.requirements,
                    "status": r.status,
                    "created_by": r.created_by,
                    "created_at": r.created_at,
                    "updated_at": r.updated_at
                }))
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(request_data),
                message: "見積依頼一覧を取得しました".to_string(),
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

async fn get_request(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_request_service::get_request_by_id(&state.db_pool, id).await {
        Ok(Some(request)) => Ok(Json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "request_id": request.request_id,
                "spec_id": request.spec_id,
                "subject": request.subject,
                "description": request.description,
                "deadline": request.deadline,
                "budget_range_min": request.budget_range_min,
                "budget_range_max": request.budget_range_max,
                "requirements": request.requirements,
                "status": request.status,
                "created_by": request.created_by,
                "created_at": request.created_at,
                "updated_at": request.updated_at
            })),
            message: "見積依頼を取得しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "REQUEST_NOT_FOUND",
                    "message": "見積依頼が見つかりません"
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
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

async fn create_request(
    State(state): State<AppState>,
    Json(payload): Json<CreateEstimateRequestRequest>,
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

    match estimate_request_service::create_request(&state.db_pool, payload).await {
        Ok(request) => Ok(Json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "request_id": request.request_id,
                "spec_id": request.spec_id,
                "subject": request.subject,
                "description": request.description,
                "deadline": request.deadline,
                "budget_range_min": request.budget_range_min,
                "budget_range_max": request.budget_range_max,
                "requirements": request.requirements,
                "status": request.status,
                "created_by": request.created_by,
                "created_at": request.created_at,
                "updated_at": request.updated_at
            })),
            message: "見積依頼を作成しました".to_string(),
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

async fn update_request(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateEstimateRequestRequest>,
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

    match estimate_request_service::update_request(&state.db_pool, id, payload).await {
        Ok(Some(request)) => Ok(Json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "request_id": request.request_id,
                "spec_id": request.spec_id,
                "subject": request.subject,
                "description": request.description,
                "deadline": request.deadline,
                "budget_range_min": request.budget_range_min,
                "budget_range_max": request.budget_range_max,
                "requirements": request.requirements,
                "status": request.status,
                "created_by": request.created_by,
                "created_at": request.created_at,
                "updated_at": request.updated_at
            })),
            message: "見積依頼を更新しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "REQUEST_NOT_FOUND",
                    "message": "見積依頼が見つかりません"
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
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

async fn delete_request(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_request_service::delete_request(&state.db_pool, id).await {
        Ok(true) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({})),
            message: "見積依頼を削除しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(false) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "REQUEST_NOT_FOUND",
                    "message": "見積依頼が見つかりません"
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
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

async fn submit_request(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_request_service::submit_request(&state.db_pool, id).await {
        Ok(Some(_)) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({})),
            message: "見積依頼を提出しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "REQUEST_NOT_FOUND",
                    "message": "見積依頼が見つかりません"
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
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

async fn get_approved_requests(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_request_service::get_approved_requests(&state.db_pool).await {
        Ok(requests) => {
            let request_data: Vec<serde_json::Value> = requests
                .into_iter()
                .map(|r| serde_json::json!({
                    "request_id": r.request_id,
                    "spec_id": r.spec_id,
                    "subject": r.subject,
                    "description": r.description,
                    "deadline": r.deadline,
                    "budget_range_min": r.budget_range_min,
                    "budget_range_max": r.budget_range_max,
                    "requirements": r.requirements,
                    "status": r.status,
                    "created_by": r.created_by,
                    "created_at": r.created_at,
                    "updated_at": r.updated_at
                }))
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(request_data),
                message: "承認済み見積依頼一覧を取得しました".to_string(),
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

async fn copy_request(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_request_service::copy_request(&state.db_pool, id, 1).await {
        Ok(Some(request)) => Ok(Json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "request_id": request.request_id,
                "spec_id": request.spec_id,
                "subject": request.subject,
                "description": request.description,
                "deadline": request.deadline,
                "budget_range_min": request.budget_range_min,
                "budget_range_max": request.budget_range_max,
                "requirements": request.requirements,
                "status": request.status,
                "created_by": request.created_by,
                "created_at": request.created_at,
                "updated_at": request.updated_at
            })),
            message: "見積依頼をコピーしました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "REQUEST_NOT_FOUND",
                    "message": "見積依頼が見つかりません"
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
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
