use anyhow::Result;
use chrono::Utc;
use sqlx::{PgPool, Row};

use crate::models::{CreateUserRequest, UpdateUserRequest, User};
use crate::services::auth_service;

pub async fn get_all_users(pool: &PgPool, page: i32, per_page: i32) -> Result<Vec<User>> {
    let offset = (page - 1) * per_page;
    
    let users = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, department, position, user_type, company_name, is_active, created_at, updated_at 
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
        "SELECT user_id, username, email, password_hash, full_name, department, position, user_type, company_name, is_active, created_at, updated_at 
         FROM users 
         WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn create_user(pool: &PgPool, request: CreateUserRequest) -> Result<User> {
    let password_hash = auth_service::hash_password(&request.password)?;
    
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (username, email, password_hash, full_name, department, position, user_type, company_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $9)
         RETURNING user_id, username, email, password_hash, full_name, department, position, user_type, company_name, is_active, created_at, updated_at"
    )
    .bind(&request.username)
    .bind(&request.email)
    .bind(&password_hash)
    .bind(&request.full_name)
    .bind(&request.department)
    .bind(&request.position)
    .bind(&request.user_type)
    .bind(&request.company_name)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn update_user(pool: &PgPool, user_id: i32, request: UpdateUserRequest) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users 
         SET username = COALESCE($2, username), email = COALESCE($3, email), full_name = COALESCE($4, full_name), department = COALESCE($5, department), position = COALESCE($6, position), company_name = COALESCE($7, company_name), is_active = COALESCE($8, is_active), updated_at = $9
         WHERE user_id = $1
         RETURNING user_id, username, email, password_hash, full_name, department, position, user_type, company_name, is_active, created_at, updated_at"
    )
    .bind(user_id)
    .bind(request.username)
    .bind(request.email)
    .bind(request.full_name)
    .bind(request.department)
    .bind(request.position)
    .bind(request.company_name)
    .bind(request.is_active)
    .bind(Utc::now())
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

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
        "SELECT user_id, username, email, password_hash, full_name, department, position, user_type, company_name, is_active, created_at, updated_at 
         FROM users 
         WHERE username = $1 AND is_active = true"
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn get_user_with_password(pool: &PgPool, username: &str) -> Result<Option<(User, String)>> {
    let result = sqlx::query(
        "SELECT user_id, username, email, password_hash, full_name, department, position, user_type, company_name, is_active, created_at, updated_at 
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
            company_name: row.get("company_name"),
            is_active: row.get("is_active"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };
        Ok(Some((user, row.get("password_hash"))))
    } else {
        Ok(None)
    }
}
