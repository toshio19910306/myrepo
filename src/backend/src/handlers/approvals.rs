use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use serde_json::json;

use crate::{
    models::{ApprovalActionRequest, CreateApprovalFlowRequest},
    services::{approval_service}, // email_service::EmailService temporarily disabled
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

#[derive(Deserialize)]
struct ApprovalQuery {
    page: Option<i32>,
    per_page: Option<i32>,
}

#[derive(serde::Deserialize)]
pub struct BulkApprovalRequest {
    pub approval_ids: Vec<String>,
    pub comments: Option<String>,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_approvals).post(create_approval_flow))
        .route("/:id", get(get_approval_flow))
        .route("/:id/approve", post(approve))
        .route("/:id/reject", post(reject))
        .route("/:id/withdraw", post(withdraw))
        .route("/:id/action", post(process_approval_action))
        .route("/:id/history", get(get_approval_history))
        .route("/history/:id", get(get_approval_history))
        .route("/bulk-approve", post(bulk_approve))
        .route("/settings", get(get_approval_settings).post(update_approval_settings))
}

async fn get_approvals(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    let mock_approvals = vec![
        json!({
            "id": "APP-001",
            "type": "見積依頼",
            "title": "新システム開発見積依頼",
            "request_id": "REQ-001",
            "requester": "山田主任",
            "department": "IT部",
            "current_step": 2,
            "total_steps": 3,
            "current_approver": "田中部長",
            "status": "承認待ち",
            "submitted_date": "2025-06-25",
            "due_date": "2025-06-30",
            "amount": "5,000,000円"
        }),
        json!({
            "id": "APP-002",
            "type": "見積回答",
            "title": "インフラ構築見積回答",
            "request_id": "RES-002",
            "requester": "佐藤課長",
            "department": "IT部",
            "current_step": 1,
            "total_steps": 2,
            "current_approver": "田中部長",
            "status": "承認待ち",
            "submitted_date": "2025-06-26",
            "due_date": "2025-07-01",
            "amount": "2,900,000円"
        }),
        json!({
            "id": "APP-003",
            "type": "仕様書",
            "title": "セキュリティ監査仕様書",
            "request_id": "SPEC-003",
            "requester": "鈴木係長",
            "department": "IT部",
            "current_step": 3,
            "total_steps": 3,
            "current_approver": "-",
            "status": "承認済み",
            "submitted_date": "2025-06-24",
            "due_date": "2025-06-29",
            "amount": "1,200,000円"
        })
    ];

    Ok(Json(ApiResponse {
        success: true,
        data: Some(json!({ "approvals": mock_approvals })),
        message: "承認一覧を取得しました".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn get_approval_flow(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match approval_service::get_approval_flow_by_id(&state.db_pool, id).await {
        Ok(Some(flow)) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({
                "flow_id": flow.flow_id,
                "target_type": flow.target_type,
                "target_id": flow.target_id,
                "current_step": flow.current_step,
                "status": flow.status,
                "created_by": flow.created_by,
                "created_at": flow.created_at,
                "updated_at": flow.updated_at
            })),
            message: "承認フロー詳細を取得しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "FLOW_NOT_FOUND",
                    "message": "承認フローが見つかりません"
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

async fn create_approval_flow(
    State(state): State<AppState>,
    Json(payload): Json<CreateApprovalFlowRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match approval_service::create_approval_flow(&state.db_pool, payload).await {
        Ok(flow) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({
                "flow_id": flow.flow_id,
                "target_type": flow.target_type,
                "target_id": flow.target_id,
                "current_step": flow.current_step,
                "status": flow.status,
                "created_by": flow.created_by,
                "created_at": flow.created_at,
                "updated_at": flow.updated_at
            })),
            message: "承認フローを作成しました".to_string(),
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

async fn approve(
    State(_state): State<AppState>,
    Path(_id): Path<String>,
    Json(payload): Json<ApprovalActionRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Ok(Json(ApiResponse {
        success: true,
        data: Some(json!({
            "approval_id": _id,
            "action": "approve",
            "comments": payload.comments,
            "processed_at": chrono::Utc::now().to_rfc3339()
        })),
        message: "承認処理が完了しました".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn reject(
    State(_state): State<AppState>,
    Path(_id): Path<String>,
    Json(payload): Json<ApprovalActionRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Ok(Json(ApiResponse {
        success: true,
        data: Some(json!({
            "approval_id": _id,
            "action": "reject",
            "comments": payload.comments,
            "processed_at": chrono::Utc::now().to_rfc3339()
        })),
        message: "差し戻し処理が完了しました".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn withdraw(
    State(_state): State<AppState>,
    Path(_id): Path<String>,
    Json(payload): Json<ApprovalActionRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Ok(Json(ApiResponse {
        success: true,
        data: Some(json!({
            "approval_id": _id,
            "action": "withdraw",
            "comments": payload.comments,
            "processed_at": chrono::Utc::now().to_rfc3339()
        })),
        message: "取り戻し処理が完了しました".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn bulk_approve(
    State(_state): State<AppState>,
    Json(payload): Json<BulkApprovalRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Ok(Json(ApiResponse {
        success: true,
        data: Some(json!({
            "processed_count": payload.approval_ids.len(),
            "approval_ids": payload.approval_ids,
            "action": "bulk_approve",
            "comments": payload.comments,
            "processed_at": chrono::Utc::now().to_rfc3339()
        })),
        message: format!("{}件の一括承認処理が完了しました", payload.approval_ids.len()),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn get_approval_settings(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    let mock_settings = json!({
        "auto_approval_enabled": false,
        "approval_threshold": 1000000,
        "notification_enabled": true,
        "escalation_days": 3,
        "approvers": [
            {
                "id": 1,
                "name": "田中部長",
                "email": "tanaka@example.com",
                "level": 1
            },
            {
                "id": 2,
                "name": "佐藤課長",
                "email": "sato@example.com",
                "level": 2
            }
        ]
    });

    Ok(Json(ApiResponse {
        success: true,
        data: Some(mock_settings),
        message: "承認設定を取得しました".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn update_approval_settings(
    State(_state): State<AppState>,
    Json(_payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Ok(Json(ApiResponse {
        success: true,
        data: Some(json!({
            "updated_at": chrono::Utc::now().to_rfc3339()
        })),
        message: "承認設定を更新しました".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn process_approval_action(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<ApprovalActionRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    // let email_service = EmailService::new(state.config.sendgrid_api_key.clone()); // Temporarily disabled
    
    match approval_service::process_approval_action(&state.db_pool, id, payload).await {
        Ok(flow) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({
                "flow_id": flow.flow_id,
                "target_type": flow.target_type,
                "target_id": flow.target_id,
                "current_step": flow.current_step,
                "status": flow.status,
                "created_by": flow.created_by,
                "created_at": flow.created_at,
                "updated_at": flow.updated_at
            })),
            message: "承認アクションを処理しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "ACTION_ERROR",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn get_approval_history(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match approval_service::get_approval_history(&state.db_pool, id).await {
        Ok(history) => {
            let history_data: Vec<serde_json::Value> = history
                .into_iter()
                .map(|h| json!({
                    "history_id": h.history_id,
                    "flow_id": h.flow_id,
                    "step_number": h.step_number,
                    "approver_id": h.approver_id,
                    "action": h.action,
                    "comments": h.comments,
                    "created_at": h.created_at
                }))
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(history_data),
                message: "承認履歴を取得しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
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
