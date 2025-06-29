use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub user_id: i32,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub full_name: String,
    pub department: Option<String>,
    pub position: Option<String>,
    pub user_type: String,
    pub company_name: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub user_id: i32,
    pub username: String,
    pub email: String,
    pub full_name: String,
    pub department: Option<String>,
    pub position: Option<String>,
    pub user_type: String,
    pub company_name: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(length(min = 3, max = 100))]
    pub username: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 6))]
    pub password: String,
    #[validate(length(min = 1, max = 100))]
    pub full_name: String,
    #[validate(length(max = 100))]
    pub department: Option<String>,
    #[validate(length(max = 50))]
    pub position: Option<String>,
    #[validate(custom(function = "validate_user_type"))]
    pub user_type: String,
    #[validate(length(max = 200))]
    pub company_name: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 3, max = 100))]
    pub username: Option<String>,
    #[validate(email)]
    pub email: Option<String>,
    #[validate(length(min = 1, max = 100))]
    pub full_name: Option<String>,
    #[validate(length(max = 100))]
    pub department: Option<String>,
    #[validate(length(max = 50))]
    pub position: Option<String>,
    #[validate(length(max = 200))]
    pub company_name: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(length(min = 1))]
    pub username: String,
    #[validate(length(min = 1))]
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserResponse,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        UserResponse {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            department: user.department,
            position: user.position,
            user_type: user.user_type,
            company_name: user.company_name,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}

fn validate_user_type(user_type: &str) -> Result<(), validator::ValidationError> {
    if matches!(user_type, "IT" | "VENDOR") {
        Ok(())
    } else {
        Err(validator::ValidationError::new("invalid_user_type"))
    }
}
