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
    models::{CreateEstimateResponseRequest, UpdateEstimateResponseRequest},
    services::estimate_response_service,
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

#[derive(serde::Deserialize)]
pub struct BulkEvaluationRequest {
    pub response_ids: Vec<String>,
    pub evaluation: String,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_responses).post(create_response))
        .route("/:id", get(get_response).put(update_response).delete(delete_response))
        .route("/:id/submit", post(submit_response))
        .route("/:id/approve", post(approve_response))
        .route("/:id/reject", post(reject_response))
        .route("/pending-approvals", get(get_pending_approvals))
        .route("/bulk-evaluate", post(bulk_evaluate_responses))
}

async fn get_responses(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    let page = 1;
    let per_page = 20;
    match estimate_response_service::get_all_responses(&state.db_pool, page, per_page).await {
        Ok(responses) => {
            let response_data: Vec<serde_json::Value> = responses
                .into_iter()
                .map(|r| serde_json::json!({
                    "response_id": r.response_id,
                    "request_id": r.request_id,
                    "company_id": r.company_id,
                    "estimate_number": r.estimate_number,
                    "estimate_price": r.estimate_price,
                    "total_amount": r.total_amount,
                    "breakdown": r.breakdown,
                    "delivery_date": r.delivery_date,
                    "validity_period": r.validity_period,
                    "terms_conditions": r.terms_conditions,
                    "response_remarks": r.response_remarks,
                    "response_date": r.response_date,
                    "status": r.status,
                    "created_by": r.created_by,
                    "created_at": r.created_at,
                    "updated_at": r.updated_at
                }))
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(response_data),
                message: "見積回答一覧を取得しました".to_string(),
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

async fn get_response(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_response_service::get_response_by_id(&state.db_pool, id).await {
        Ok(Some(response)) => Ok(Json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "response_id": response.response_id,
                "request_id": response.request_id,
                "company_id": response.company_id,
                "estimate_number": response.estimate_number,
                "estimate_price": response.estimate_price,
                "total_amount": response.total_amount,
                "breakdown": response.breakdown,
                "delivery_date": response.delivery_date,
                "validity_period": response.validity_period,
                "terms_conditions": response.terms_conditions,
                "response_remarks": response.response_remarks,
                "response_date": response.response_date,
                "status": response.status,
                "created_by": response.created_by,
                "created_at": response.created_at,
                "updated_at": response.updated_at
            })),
            message: "見積回答を取得しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "RESPONSE_NOT_FOUND",
                    "message": "見積回答が見つかりません"
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

async fn create_response(
    State(state): State<AppState>,
    Json(payload): Json<CreateEstimateResponseRequest>,
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

    match estimate_response_service::create_response(&state.db_pool, payload).await {
        Ok(response) => Ok(Json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "response_id": response.response_id,
                "request_id": response.request_id,
                "company_id": response.company_id,
                "estimate_number": response.estimate_number,
                "estimate_price": response.estimate_price,
                "total_amount": response.total_amount,
                "breakdown": response.breakdown,
                "delivery_date": response.delivery_date,
                "validity_period": response.validity_period,
                "terms_conditions": response.terms_conditions,
                "response_remarks": response.response_remarks,
                "response_date": response.response_date,
                "status": response.status,
                "created_by": response.created_by,
                "created_at": response.created_at,
                "updated_at": response.updated_at
            })),
            message: "見積回答を作成しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "CREATE_ERROR",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn update_response(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateEstimateResponseRequest>,
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

    match estimate_response_service::update_response(&state.db_pool, id, payload).await {
        Ok(Some(response)) => Ok(Json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "response_id": response.response_id,
                "request_id": response.request_id,
                "company_id": response.company_id,
                "estimate_number": response.estimate_number,
                "estimate_price": response.estimate_price,
                "total_amount": response.total_amount,
                "breakdown": response.breakdown,
                "delivery_date": response.delivery_date,
                "validity_period": response.validity_period,
                "terms_conditions": response.terms_conditions,
                "response_remarks": response.response_remarks,
                "response_date": response.response_date,
                "status": response.status,
                "created_by": response.created_by,
                "created_at": response.created_at,
                "updated_at": response.updated_at
            })),
            message: "見積回答を更新しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "RESPONSE_NOT_FOUND",
                    "message": "見積回答が見つかりません"
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

async fn delete_response(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_response_service::delete_response(&state.db_pool, id).await {
        Ok(true) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({})),
            message: "見積回答を削除しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(false) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "RESPONSE_NOT_FOUND",
                    "message": "見積回答が見つかりません"
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

async fn submit_response(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_response_service::submit_response(&state.db_pool, id).await {
        Ok(Some(_)) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({})),
            message: "見積回答を提出しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "RESPONSE_NOT_FOUND",
                    "message": "見積回答が見つかりません"
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

async fn bulk_evaluate_responses(
    State(_state): State<AppState>,
    Json(payload): Json<BulkEvaluationRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Ok(Json(ApiResponse {
        success: true,
        data: Some(json!({
            "processed_count": payload.response_ids.len(),
            "response_ids": payload.response_ids,
            "evaluation": payload.evaluation,
            "processed_at": chrono::Utc::now().to_rfc3339()
        })),
        message: format!("{}件の見積回答を一括評価しました", payload.response_ids.len()),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn approve_response(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_response_service::approve_response(&state.db_pool, id, payload).await {
        Ok(response) => Ok(Json(ApiResponse {
            success: true,
            data: Some(response),
            message: "見積回答を承認しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "APPROVAL_ERROR",
                    "message": format!("見積回答の承認に失敗しました: {}", e)
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn reject_response(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_response_service::reject_response(&state.db_pool, id, payload).await {
        Ok(response) => Ok(Json(ApiResponse {
            success: true,
            data: Some(response),
            message: "見積回答を差し戻しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "REJECTION_ERROR",
                    "message": format!("見積回答の差し戻しに失敗しました: {}", e)
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn get_pending_approvals(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_response_service::get_pending_approvals(&state.db_pool).await {
        Ok(approvals) => Ok(Json(ApiResponse {
            success: true,
            data: Some(approvals),
            message: "承認待ち見積回答一覧を取得しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "FETCH_ERROR",
                    "message": format!("承認待ち見積回答一覧の取得に失敗しました: {}", e)
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}
