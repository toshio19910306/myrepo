use anyhow::Result;
use chrono::Utc;
use sqlx::PgPool;

use crate::models::{CreateUserRequest, UpdateUserRequest, User, UserResponse};
use crate::services::auth_service;

pub async fn get_all_users(pool: &PgPool) -> Result<Vec<UserResponse>> {
    let users = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, role, department, position, user_type, company_name, is_active, created_at, updated_at 
         FROM users 
         WHERE is_active = true 
         ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;

    Ok(users.into_iter().map(|u| u.into()).collect())
}

pub async fn get_user_by_id(pool: &PgPool, id: i32) -> Result<Option<UserResponse>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT user_id, username, email, password_hash, full_name, role, department, position, user_type, company_name, is_active, created_at, updated_at 
         FROM users 
         WHERE user_id = $1 AND is_active = true"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(user.map(|u| u.into()))
}

pub async fn create_user(pool: &PgPool, request: CreateUserRequest) -> Result<UserResponse> {
    let password_hash = auth_service::hash_password(&request.password)?;
    
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (username, email, password_hash, full_name, role, department, position, user_type, company_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $10)
         RETURNING user_id, username, email, password_hash, full_name, role, department, position, user_type, company_name, is_active, created_at, updated_at"
    )
    .bind(&request.username)
    .bind(&request.email)
    .bind(&password_hash)
    .bind(&request.full_name)
    .bind("user") // default role
    .bind(&request.department)
    .bind(&request.position)
    .bind(&request.user_type)
    .bind(&request.company_name)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;

    Ok(user.into())
}

pub async fn update_user(pool: &PgPool, id: i32, request: UpdateUserRequest) -> Result<Option<UserResponse>> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users 
         SET username = COALESCE($2, username),
             email = COALESCE($3, email),
             full_name = COALESCE($4, full_name),
             department = COALESCE($5, department),
             position = COALESCE($6, position),
             company_name = COALESCE($7, company_name),
             is_active = COALESCE($8, is_active),
             updated_at = $9
         WHERE user_id = $1 AND is_active = true
         RETURNING user_id, username, email, password_hash, full_name, role, department, position, user_type, company_name, is_active, created_at, updated_at"
    )
    .bind(id)
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

    Ok(user.map(|u| u.into()))
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
        "SELECT user_id, username, email, password_hash, full_name, role, department, position, user_type, company_name, is_active, created_at, updated_at 
         FROM users 
         WHERE username = $1 AND is_active = true"
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}
