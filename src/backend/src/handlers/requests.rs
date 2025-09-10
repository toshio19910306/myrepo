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
    services::{estimate_request_service, user_service},
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_requests).post(create_request))
        .route("/approved", get(get_approved_requests))
        .route("/approved-with-companies", get(get_approved_requests_with_companies))
        .route("/:id", get(get_request).put(update_request).delete(delete_request))
        .route("/:id/submit", post(submit_request))
        .route("/:id/submit-for-approval", post(submit_request_for_approval))
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
                    "company_id": r.company_id,
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
                "company_id": request.company_id,
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
                "company_id": request.company_id,
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
                "company_id": request.company_id,
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
                    "company_id": r.company_id,
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
                "company_id": request.company_id,
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
#[derive(serde::Deserialize)]
struct SubmitForApprovalRequest {
    approver_ids: Vec<i32>,
}

async fn submit_request_for_approval(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<SubmitForApprovalRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    let mut tx = state.db_pool.begin().await.map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "TRANSACTION_ERROR",
                "message": e.to_string()
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    })?;

    sqlx::query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "TRANSACTION_SETUP_ERROR", 
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        })?;

    let constraint_check = sqlx::query_scalar::<_, bool>(
        "SELECT 'PENDING_APPROVAL'::text = ANY (ARRAY['DRAFT'::character varying, 'SUBMITTED'::character varying, 'PENDING_APPROVAL'::character varying, 'RESPONDED'::character varying, 'CLOSED'::character varying]::text[])"
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        eprintln!("Constraint pre-check failed: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "CONSTRAINT_CHECK_ERROR",
                "message": format!("制約事前チェックに失敗しました: {}", e)
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    })?;

    if !constraint_check {
        return Err((StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "CONSTRAINT_VALIDATION_ERROR",
                "message": "PENDING_APPROVALは有効なステータス値ではありません"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })));
    }

    println!("DEBUG: About to update request {} with status 'PENDING_APPROVAL'", id);
    println!("DEBUG: Current timestamp: {}", chrono::Utc::now());

    let updated_request = sqlx::query_as::<_, crate::models::EstimateRequest>(
        "UPDATE estimate_requests 
         SET status = $1, updated_at = $2
         WHERE request_id = $3 AND status IN ('DRAFT', 'CLOSED')
         RETURNING request_id, spec_id, subject, description, deadline, budget_range_min, budget_range_max, requirements, company_id, status, created_by, created_at, updated_at"
    )
    .bind("PENDING_APPROVAL")
    .bind(chrono::Utc::now())
    .bind(id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| {
        eprintln!("Database error during status update: {}", e);
        eprintln!("Error details: {:?}", e);
        
        if e.to_string().contains("estimate_requests_status_check") {
            eprintln!("CONSTRAINT ERROR DETECTED - investigating parameters");
            eprintln!("Request ID: {}", id);
            eprintln!("Target status: PENDING_APPROVAL");
        }
        
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "UPDATE_ERROR",
                "message": format!("ステータス更新に失敗しました: {}", e)
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    })?;

    if updated_request.is_none() {
        return Err((StatusCode::BAD_REQUEST, Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "INVALID_STATUS_TRANSITION",
                "message": "承認申請できません。リクエストが見つからないか、既に承認申請済みです。"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })));
    }

    let approval_request = crate::models::CreateApprovalFlowRequest {
        target_type: "REQUEST".to_string(),
        target_id: id,
        approver_ids: payload.approver_ids,
        created_by: 1,
    };

    let approval_flow = crate::services::approval_service_impl::create_approval_flow(&mut tx, approval_request).await.map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "APPROVAL_FLOW_ERROR",
                "message": e.to_string()
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    })?;

    // if !state.config.sendgrid_api_key.is_empty() {
    //     let email_service = email_service::EmailService::new(state.config.sendgrid_api_key.clone());
    //     
    //     for approver_id in &payload.approver_ids {
    //         if let Ok(Some(approver)) = user_service::get_user_by_id(&state.db_pool, *approver_id).await {
    //             let _ = email_service.send_approval_notification(
    //                 &approver.email,
    //                 &approver.full_name,
    //                 &format!("見積依頼の承認依頼: {}", updated_request.as_ref().unwrap().subject),
    //                 "見積依頼",
    //                 &updated_request.as_ref().unwrap().subject,
    //                 &updated_request.as_ref().unwrap().created_by.map(|id| id.to_string()).unwrap_or_else(|| "unknown".to_string())
    //             ).await;
    //         }
    //     }
    // }

    tx.commit().await.map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "COMMIT_ERROR",
                "message": e.to_string()
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    })?;

    Ok(Json(ApiResponse {
        success: true,
        data: Some(json!({
            "request": updated_request.unwrap(),
            "approval_flow": approval_flow
        })),
        message: "承認申請を送信しました".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn get_approved_requests_with_companies(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match estimate_request_service::get_approved_requests_with_companies(&state.db_pool).await {
        Ok(request_data) => {
            Ok(Json(ApiResponse {
                success: true,
                data: Some(request_data),
                message: "承認済み見積依頼一覧（会社名付き）を取得しました".to_string(),
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
