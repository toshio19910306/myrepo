use anyhow::Result;

use crate::models::{EstimateRequest, CreateEstimateRequestRequest, UpdateEstimateRequestRequest};
use crate::services::estimate_request_service_impl;
use sqlx::PgPool;

pub async fn get_all_requests(pool: &PgPool, page: i32, per_page: i32) -> Result<Vec<EstimateRequest>> {
    estimate_request_service_impl::get_all_requests(pool, page, per_page).await
}

pub async fn get_request_by_id(pool: &PgPool, request_id: i32) -> Result<Option<EstimateRequest>> {
    estimate_request_service_impl::get_request_by_id(pool, request_id).await
}

pub async fn create_request(pool: &PgPool, request: CreateEstimateRequestRequest) -> Result<EstimateRequest> {
    estimate_request_service_impl::create_request(pool, request).await
}

pub async fn update_request(pool: &PgPool, request_id: i32, request: UpdateEstimateRequestRequest) -> Result<Option<EstimateRequest>> {
    estimate_request_service_impl::update_request(pool, request_id, request).await
}

pub async fn delete_request(pool: &PgPool, request_id: i32) -> Result<bool> {
    estimate_request_service_impl::delete_request(pool, request_id).await
}

pub async fn submit_request(pool: &PgPool, request_id: i32) -> Result<Option<EstimateRequest>> {
    estimate_request_service_impl::submit_request(pool, request_id).await
}

pub async fn copy_request(pool: &PgPool, request_id: i32, created_by: i32) -> Result<Option<EstimateRequest>> {
    estimate_request_service_impl::copy_request(pool, request_id, created_by).await
}

pub async fn get_approved_requests(pool: &PgPool) -> Result<Vec<EstimateRequest>> {
    estimate_request_service_impl::get_approved_requests(pool).await
}

pub async fn get_approved_requests_with_companies(pool: &PgPool) -> Result<Vec<serde_json::Value>> {
    estimate_request_service_impl::get_approved_requests_with_companies(pool).await
}
