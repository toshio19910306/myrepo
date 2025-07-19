use anyhow::Result;
use chrono::Utc;
use sqlx::{PgPool, Row};

use crate::models::{User};
// use crate::services::auth_service; // Temporarily disabled

pub async fn get_all_users(pool: &PgPool, page: i32, per_page: i32) -> Result<Vec<User>> {
    let offset = (page - 1) * per_page;
    
    let users = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, department, position, user_type, is_active, created_at, updated_at 
         FROM users 
         WHERE is_active = true 
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2"
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(pool)
    .await?;

    Ok(users)
}

pub async fn get_user_by_id(pool: &PgPool, user_id: i32) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, department, position, user_type, is_active, created_at, updated_at 
         FROM users 
         WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

// pub async fn create_user(pool: &PgPool, request: CreateUserRequest) -> Result<User> {

// pub async fn update_user(pool: &PgPool, user_id: i32, request: UpdateUserRequest) -> Result<Option<User>> {

pub async fn delete_user(pool: &PgPool, user_id: i32) -> Result<bool> {
    let result = sqlx::query(
        "UPDATE users SET is_active = false, updated_at = $2 WHERE user_id = $1"
    )
    .bind(user_id)
    .bind(Utc::now())
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn get_user_by_username(pool: &PgPool, username: &str) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, department, position, user_type, is_active, created_at, updated_at 
         FROM users 
         WHERE username = $1 AND is_active = true"
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn get_users_by_type(pool: &PgPool, _user_type: Option<String>) -> Result<Vec<User>> {
    let users = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, department, position, user_type, is_active, created_at, updated_at
         FROM users 
         WHERE is_active = true
         ORDER BY full_name"
    )
    .fetch_all(pool)
    .await?;

    Ok(users)
}

pub async fn get_user_with_password(pool: &PgPool, username: &str) -> Result<Option<(User, String)>> {
    let result = sqlx::query(
        "SELECT user_id, username, email, password_hash, full_name, department, position, user_type, is_active, created_at, updated_at 
         FROM users 
         WHERE username = $1 AND is_active = true"
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = result {
        let user = User {
            user_id: row.get("user_id"),
            username: row.get("username"),
            email: row.get("email"),
            password_hash: row.get("password_hash"),
            full_name: row.get("full_name"),
            department: row.get("department"),
            position: row.get("position"),
            user_type: row.get("user_type"),
            is_active: row.get("is_active"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };
        Ok(Some((user, row.get("password_hash"))))
    } else {
        Ok(None)
    }
}
