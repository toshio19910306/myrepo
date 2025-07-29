use anyhow::Result;
use chrono::Utc;
use sqlx::{PgPool, Row};
use serde_json;

use crate::models::{ApprovalFlow, CreateApprovalFlowRequest, ApprovalActionRequest};
use crate::services::{approval_service_impl}; // email_service::EmailService temporarily disabled

pub async fn get_all_approval_flows(pool: &PgPool, page: i32, per_page: i32) -> Result<Vec<ApprovalFlow>> {
    let offset = (page - 1) * per_page;
    
    let flows = sqlx::query_as::<_, ApprovalFlow>(
        "SELECT flow_id, target_type, target_id, current_step, status, created_by, created_at, updated_at
         FROM approval_flows
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2"
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(pool)
    .await?;

    Ok(flows)
}

pub async fn get_approval_flow_by_id(pool: &PgPool, flow_id: i32) -> Result<Option<ApprovalFlow>> {
    let flow = sqlx::query_as::<_, ApprovalFlow>(
        "SELECT flow_id, target_type, target_id, current_step, status, created_by, created_at, updated_at
         FROM approval_flows
         WHERE flow_id = $1"
    )
    .bind(flow_id)
    .fetch_optional(pool)
    .await?;

    Ok(flow)
}

pub async fn create_approval_flow(
    pool: &PgPool,
    request: CreateApprovalFlowRequest,
) -> Result<ApprovalFlow> {
    let mut tx = pool.begin().await?;
    let result = approval_service_impl::create_approval_flow(&mut tx, request).await?;
    tx.commit().await?;
    Ok(result)
}

pub async fn process_approval_action(
    pool: &PgPool,
    // email_service: &EmailService, // Temporarily disabled
    flow_id: i32,
    request: ApprovalActionRequest,
) -> Result<ApprovalFlow> {
    approval_service_impl::process_approval_action(pool, flow_id, request).await
}

pub async fn get_approval_history(pool: &PgPool, flow_id: i32) -> Result<Vec<crate::models::ApprovalHistory>> {
    approval_service_impl::get_approval_history(pool, flow_id).await
}

pub async fn get_pending_approvals_for_user(pool: &PgPool, user_id: i32) -> Result<Vec<serde_json::Value>> {
    let approvals = sqlx::query(
        "SELECT af.flow_id, af.target_type, af.target_id, af.current_step, af.status,
                er.request_id, er.subject as title, er.description, er.deadline,
                er.budget_range_min, er.budget_range_max, er.created_at as submitted_date,
                u.full_name as requester, u.department,
                as_current.approver_id as current_approver_id
         FROM approval_flows af
         INNER JOIN estimate_requests er ON af.target_type = 'REQUEST' AND af.target_id = er.request_id
         INNER JOIN users u ON er.created_by = u.user_id
         INNER JOIN approval_steps as_current ON af.flow_id = as_current.flow_id 
             AND as_current.step_order = af.current_step
         WHERE af.status = 'PENDING' AND as_current.approver_id = $1
         ORDER BY er.created_at DESC"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    let result: Vec<serde_json::Value> = approvals.into_iter().map(|row| {
        serde_json::json!({
            "id": format!("APP-{:03}", row.get::<i32, _>("flow_id")),
            "type": "見積依頼",
            "title": row.get::<String, _>("title"),
            "request_id": format!("REQ-{:03}", row.get::<i32, _>("request_id")),
            "requester": row.get::<String, _>("requester"),
            "department": row.get::<Option<String>, _>("department").unwrap_or_else(|| "未設定".to_string()),
            "current_step": row.get::<i32, _>("current_step"),
            "total_steps": 3,
            "current_approver_id": row.get::<i32, _>("current_approver_id"),
            "status": "承認待ち",
            "submitted_date": row.get::<chrono::DateTime<chrono::Utc>, _>("submitted_date").format("%Y-%m-%d").to_string(),
            "due_date": row.get::<chrono::DateTime<chrono::Utc>, _>("deadline").format("%Y-%m-%d").to_string(),
            "amount": format!("{}円", row.get::<Option<rust_decimal::Decimal>, _>("budget_range_max").unwrap_or_else(|| rust_decimal::Decimal::new(0, 0)))
        })
    }).collect();

    Ok(result)
}

pub async fn create_approval_flow_with_transaction(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    request: CreateApprovalFlowRequest,
) -> Result<ApprovalFlow> {
    approval_service_impl::create_approval_flow(tx, request).await
}
