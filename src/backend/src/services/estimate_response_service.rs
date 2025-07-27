use anyhow::Result;

use crate::models::{EstimateResponse, CreateEstimateResponseRequest, UpdateEstimateResponseRequest};
use crate::services::estimate_response_service_impl;
use sqlx::PgPool;

pub async fn get_all_responses(pool: &PgPool, page: i32, per_page: i32) -> Result<Vec<EstimateResponse>> {
    estimate_response_service_impl::get_all_responses(pool, page, per_page).await
}

pub async fn get_response_by_id(pool: &PgPool, response_id: i32) -> Result<Option<EstimateResponse>> {
    estimate_response_service_impl::get_response_by_id(pool, response_id).await
}

pub async fn create_response(pool: &PgPool, request: CreateEstimateResponseRequest) -> Result<EstimateResponse> {
    estimate_response_service_impl::create_response(pool, request).await
}

pub async fn update_response(pool: &PgPool, response_id: i32, request: UpdateEstimateResponseRequest) -> Result<Option<EstimateResponse>> {
    estimate_response_service_impl::update_response(pool, response_id, request).await
}

pub async fn delete_response(pool: &PgPool, response_id: i32) -> Result<bool> {
    estimate_response_service_impl::delete_response(pool, response_id).await
}

pub async fn submit_response(pool: &PgPool, response_id: i32) -> Result<Option<EstimateResponse>> {
    estimate_response_service_impl::submit_response(pool, response_id).await
}

pub async fn approve_response(
    db_pool: &PgPool,
    response_id: i32,
    _payload: serde_json::Value,
) -> Result<serde_json::Value> {
    let updated_response = sqlx::query_as!(
        EstimateResponse,
        r#"
        UPDATE estimate_responses 
        SET status = 'approved', updated_at = NOW()
        WHERE response_id = $1
        RETURNING *
        "#,
        response_id
    )
    .fetch_one(db_pool)
    .await?;

    Ok(serde_json::to_value(updated_response)?)
}

pub async fn reject_response(
    db_pool: &PgPool,
    response_id: i32,
    _payload: serde_json::Value,
) -> Result<serde_json::Value> {
    let updated_response = sqlx::query_as!(
        EstimateResponse,
        r#"
        UPDATE estimate_responses 
        SET status = 'rejected', updated_at = NOW()
        WHERE response_id = $1
        RETURNING *
        "#,
        response_id
    )
    .fetch_one(db_pool)
    .await?;

    Ok(serde_json::to_value(updated_response)?)
}

pub async fn get_pending_approvals(
    db_pool: &PgPool,
) -> Result<Vec<serde_json::Value>> {
    let responses = sqlx::query_as!(
        EstimateResponse,
        r#"
        SELECT * FROM estimate_responses 
        WHERE status = 'submitted'
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(db_pool)
    .await?;

    let mut approvals = Vec::new();
    for response in responses {
        let approval_item = serde_json::json!({
            "response_id": response.response_id,
            "estimate_number": response.estimate_number,
            "estimate_price": response.estimate_price,
            "vendor_name": "ベンダー名",
            "request_subject": "見積依頼件名",
            "status": "pending",
            "submitted_date": response.created_at,
            "current_approver": "承認者名",
            "current_approver_id": 1
        });
        approvals.push(approval_item);
    }

    Ok(approvals)
}
