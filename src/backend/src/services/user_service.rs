use anyhow::Result;
use chrono::Utc;
use sqlx::PgPool;
use serde::{Deserialize, Serialize};

use crate::models::{User};

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateUserRequest {
    pub full_name: Option<String>,
    pub email: Option<String>,
    pub department: Option<String>,
    pub position: Option<String>,
    pub user_type: Option<String>,
    pub company_name: Option<String>,
}

pub async fn get_all_users(pool: &PgPool, page: i32, limit: i32) -> Result<Vec<User>> {
    crate::services::user_service_impl::get_all_users(pool, page, limit).await
}

pub async fn get_user_by_id(pool: &PgPool, user_id: i32) -> Result<Option<User>> {
    crate::services::user_service_impl::get_user_by_id(pool, user_id).await
}

pub async fn get_user_by_username(pool: &PgPool, username: &str) -> Result<Option<User>> {
    crate::services::user_service_impl::get_user_by_username(pool, username).await
}

pub async fn get_users_by_type(pool: &PgPool, user_type: Option<String>) -> Result<Vec<User>> {
    crate::services::user_service_impl::get_users_by_type(pool, user_type).await
}

pub async fn update_user(pool: &PgPool, user_id: i32, request: UpdateUserRequest) -> Result<Option<User>> {
    crate::services::user_service_impl::update_user(pool, user_id, request).await
}

pub async fn delete_user(pool: &PgPool, user_id: i32) -> Result<bool> {
    crate::services::user_service_impl::delete_user(pool, user_id).await
}

#[derive(serde::Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub department: Option<String>,
    pub position: Option<String>,
    pub user_type: String,
    pub permissions: Option<Vec<String>>,
}

pub async fn create_user(pool: &PgPool, request: CreateUserRequest) -> Result<User> {
    let password_hash = bcrypt::hash(&request.password, bcrypt::DEFAULT_COST)
        .map_err(|e| anyhow::anyhow!("Failed to hash password: {}", e))?;

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (username, email, password_hash, full_name, department, position, user_type, company_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING user_id, username, email, password_hash, full_name, department, position, user_type, company_name, is_active, created_at, updated_at"
    )
    .bind(&request.username)
    .bind(&request.email)
    .bind(&password_hash)
    .bind(&request.full_name)
    .bind(&request.department)
    .bind(&request.position)
    .bind(&request.user_type)
    .bind("Default Company")
    .bind(true)
    .bind(Utc::now())
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;

    Ok(user)
}
