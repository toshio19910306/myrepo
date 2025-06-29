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
