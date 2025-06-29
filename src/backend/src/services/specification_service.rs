use anyhow::Result;

use crate::models::{Specification, CreateSpecificationRequest, UpdateSpecificationRequest};
use crate::services::specification_service_impl;
use sqlx::PgPool;

pub async fn get_all_specifications(pool: &PgPool, page: i32, per_page: i32) -> Result<Vec<Specification>> {
    specification_service_impl::get_all_specifications(pool, page, per_page).await
}

pub async fn get_specification_by_id(pool: &PgPool, spec_id: i32) -> Result<Option<Specification>> {
    specification_service_impl::get_specification_by_id(pool, spec_id).await
}

pub async fn create_specification(pool: &PgPool, request: CreateSpecificationRequest) -> Result<Specification> {
    specification_service_impl::create_specification(pool, request).await
}

pub async fn update_specification(pool: &PgPool, spec_id: i32, request: UpdateSpecificationRequest) -> Result<Option<Specification>> {
    specification_service_impl::update_specification(pool, spec_id, request).await
}

pub async fn delete_specification(pool: &PgPool, spec_id: i32) -> Result<bool> {
    specification_service_impl::delete_specification(pool, spec_id).await
}

pub async fn submit_specification(pool: &PgPool, spec_id: i32) -> Result<Option<Specification>> {
    specification_service_impl::submit_specification(pool, spec_id).await
}

pub async fn get_work_items() -> Result<Vec<serde_json::Value>> {
    specification_service_impl::get_work_items().await
}

pub async fn get_deliverables() -> Result<Vec<serde_json::Value>> {
    specification_service_impl::get_deliverables().await
}
