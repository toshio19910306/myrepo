pub mod config;
pub mod handlers {
    pub mod users;
    pub mod specifications;
    pub mod requests;
    pub mod responses;
    pub mod approvals;
    pub mod approval_history;
    pub mod files;
}
pub mod middleware;
pub mod models;
pub mod services {
    pub mod specification_service;
    pub mod specification_service_impl;
    pub mod estimate_request_service;
    pub mod estimate_request_service_impl;
    pub mod estimate_response_service;
    pub mod estimate_response_service_impl;
    pub mod approval_service;
    pub mod approval_service_impl;
    pub mod file_service;
    pub mod user_service;
    pub mod user_service_impl;
}
pub mod utils;
pub mod database;

use axum::extract::FromRef;
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<config::Config>,
    pub db_pool: PgPool,
}

impl FromRef<AppState> for PgPool {
    fn from_ref(state: &AppState) -> PgPool {
        state.db_pool.clone()
    }
}

impl FromRef<AppState> for Arc<config::Config> {
    fn from_ref(state: &AppState) -> Arc<config::Config> {
        state.config.clone()
    }
}
