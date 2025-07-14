use anyhow::Result;
use chrono::Utc;
use sqlx::PgPool;

use crate::models::{ApprovalFlow, CreateApprovalFlowRequest, ApprovalActionRequest};
use crate::services::{approval_service_impl, email_service::EmailService};

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
    approval_service_impl::create_approval_flow(pool, request).await
}

pub async fn process_approval_action(
    pool: &PgPool,
    email_service: &EmailService,
    flow_id: i32,
    request: ApprovalActionRequest,
) -> Result<ApprovalFlow> {
    approval_service_impl::process_approval_action(pool, email_service, flow_id, request).await
}

pub async fn get_approval_history(pool: &PgPool, flow_id: i32) -> Result<Vec<crate::models::ApprovalHistory>> {
    approval_service_impl::get_approval_history(pool, flow_id).await
}
