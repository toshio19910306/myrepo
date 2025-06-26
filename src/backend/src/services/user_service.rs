use anyhow::Result;
use chrono::Utc;

use crate::models::{CreateUserRequest, UpdateUserRequest, User, UserResponse};
use crate::services::auth_service;

pub async fn get_all_users() -> Result<Vec<UserResponse>> {
    let users = vec![
        User {
            user_id: 1,
            username: "admin".to_string(),
            email: "admin@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            full_name: "管理者".to_string(),
            department: Some("IT企画部".to_string()),
            position: Some("部長".to_string()),
            user_type: "IT".to_string(),
            company_name: None,
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        },
        User {
            user_id: 2,
            username: "vendor1".to_string(),
            email: "vendor1@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            full_name: "ベンダー担当者".to_string(),
            department: Some("営業部".to_string()),
            position: Some("課長".to_string()),
            user_type: "VENDOR".to_string(),
            company_name: Some("株式会社サンプルベンダー".to_string()),
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        },
    ];

    Ok(users.into_iter().map(|u| u.into()).collect())
}

pub async fn get_user_by_id(id: i32) -> Result<Option<UserResponse>> {
    if id == 1 {
        let user = User {
            user_id: 1,
            username: "admin".to_string(),
            email: "admin@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            full_name: "管理者".to_string(),
            department: Some("IT企画部".to_string()),
            position: Some("部長".to_string()),
            user_type: "IT".to_string(),
            company_name: None,
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        Ok(Some(user.into()))
    } else {
        Ok(None)
    }
}

pub async fn create_user(request: CreateUserRequest) -> Result<UserResponse> {
    let password_hash = auth_service::hash_password(&request.password)?;
    
    let user = User {
        user_id: 999,
        username: request.username,
        email: request.email,
        password_hash,
        full_name: request.full_name,
        department: request.department,
        position: request.position,
        user_type: request.user_type,
        company_name: request.company_name,
        is_active: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    Ok(user.into())
}

pub async fn update_user(id: i32, request: UpdateUserRequest) -> Result<Option<UserResponse>> {
    if id == 1 {
        let mut user = User {
            user_id: 1,
            username: "admin".to_string(),
            email: "admin@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            full_name: "管理者".to_string(),
            department: Some("IT企画部".to_string()),
            position: Some("部長".to_string()),
            user_type: "IT".to_string(),
            company_name: None,
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        if let Some(username) = request.username {
            user.username = username;
        }
        if let Some(email) = request.email {
            user.email = email;
        }
        if let Some(full_name) = request.full_name {
            user.full_name = full_name;
        }
        if let Some(department) = request.department {
            user.department = Some(department);
        }
        if let Some(position) = request.position {
            user.position = Some(position);
        }
        if let Some(company_name) = request.company_name {
            user.company_name = Some(company_name);
        }
        if let Some(is_active) = request.is_active {
            user.is_active = is_active;
        }
        user.updated_at = Utc::now();

        Ok(Some(user.into()))
    } else {
        Ok(None)
    }
}

pub async fn delete_user(id: i32) -> Result<bool> {
    if id == 1 {
        Ok(false)
    } else {
        Ok(true)
    }
}
