use anyhow::Result;
use chrono::Utc;
use sqlx::PgPool;

use crate::models::{User};
// use crate::services::auth_service; // Temporarily disabled

pub async fn get_all_users(pool: &PgPool) -> Result<Vec<User>> {
    let users = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, role, department, position, user_type, company_name, is_active, created_at, updated_at 
         FROM users 
         WHERE is_active = true 
         ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;

    Ok(users)
}

pub async fn get_user_by_id(pool: &PgPool, id: i32) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, role, department, position, user_type, company_name, is_active, created_at, updated_at 
         FROM users 
         WHERE user_id = $1 AND is_active = true"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

// pub async fn create_user(pool: &PgPool, request: CreateUserRequest) -> Result<User> {

// pub async fn update_user(pool: &PgPool, id: i32, request: UpdateUserRequest) -> Result<Option<User>> {

pub async fn delete_user(pool: &PgPool, id: i32) -> Result<bool> {
    let result = sqlx::query(
        "UPDATE users SET is_active = false, updated_at = $2 WHERE user_id = $1 AND is_active = true"
    )
    .bind(id)
    .bind(Utc::now())
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn get_user_by_username(pool: &PgPool, username: &str) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, role, department, position, user_type, company_name, is_active, created_at, updated_at 
         FROM users 
         WHERE username = $1 AND is_active = true"
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}
