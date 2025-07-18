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
}

pub async fn get_all_users(pool: &PgPool, page: i32, limit: i32) -> Result<Vec<User>> {
    let offset = (page - 1) * limit;
    let users = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, department, position, is_active, created_at, updated_at 
         FROM users 
         WHERE is_active = true 
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    Ok(users)
}

pub async fn get_user_by_id(pool: &PgPool, id: i32) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, department, position, is_active, created_at, updated_at 
         FROM users 
         WHERE user_id = $1 AND is_active = true"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

#[derive(serde::Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub department: Option<String>,
    pub position: Option<String>,
    pub permissions: Option<Vec<String>>,
}

pub async fn create_user(pool: &PgPool, request: CreateUserRequest) -> Result<User> {
    let password_hash = bcrypt::hash(&request.password, bcrypt::DEFAULT_COST)
        .map_err(|e| anyhow::anyhow!("Failed to hash password: {}", e))?;

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (username, email, password_hash, full_name, department, position, user_type, company_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'IT', 'Default Company', $7, $8, $9)
         RETURNING user_id, username, email, password_hash, full_name, department, position, is_active, created_at, updated_at"
    )
    .bind(&request.username)
    .bind(&request.email)
    .bind(&password_hash)
    .bind(&request.full_name)
    .bind(&request.department)
    .bind(&request.position)
    .bind("IT")
    .bind("Default Company")
    .bind(true)
    .bind(Utc::now())
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn update_user(pool: &PgPool, user_id: i32, request: UpdateUserRequest) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users SET 
         full_name = COALESCE($2, full_name),
         email = COALESCE($3, email),
         department = COALESCE($4, department),
         position = COALESCE($5, position),
         updated_at = $6
         WHERE user_id = $1 AND is_active = true
         RETURNING user_id, username, email, password_hash, full_name, department, position, is_active, created_at, updated_at"
    )
    .bind(user_id)
    .bind(&request.full_name)
    .bind(&request.email)
    .bind(&request.department)
    .bind(&request.position)
    .bind(Utc::now())
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn get_users_by_type(pool: &PgPool, user_type: Option<String>) -> Result<Vec<User>> {
    let users = match user_type {
        Some(ut) => {
            sqlx::query_as::<_, User>(
                "SELECT user_id, username, email, password_hash, full_name, department, position, is_active, created_at, updated_at 
                 FROM users 
                 WHERE is_active = true
                 ORDER BY created_at DESC"
            )
            .fetch_all(pool)
            .await?
        },
        None => {
            sqlx::query_as::<_, User>(
                "SELECT user_id, username, email, password_hash, full_name, department, position, is_active, created_at, updated_at 
                 FROM users 
                 WHERE is_active = true
                 ORDER BY created_at DESC"
            )
            .fetch_all(pool)
            .await?
        }
    };

    Ok(users)
}

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
        "SELECT user_id, username, email, password_hash, full_name, department, position, is_active, created_at, updated_at 
         FROM users 
         WHERE username = $1 AND is_active = true"
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}
