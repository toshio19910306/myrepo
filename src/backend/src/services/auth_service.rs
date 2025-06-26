use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Deserialize, Serialize};
use chrono::{Duration, Utc};

use crate::models::{LoginResponse, User, UserResponse};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub user_id: i32,
    pub user_type: String,
    pub exp: usize,
}

pub async fn authenticate_user(username: &str, password: &str) -> Result<LoginResponse> {
    let user = User {
        user_id: 1,
        username: username.to_string(),
        email: "admin@example.com".to_string(),
        password_hash: hash("password", DEFAULT_COST)?,
        full_name: "管理者".to_string(),
        department: Some("IT企画部".to_string()),
        position: Some("部長".to_string()),
        user_type: "IT".to_string(),
        company_name: None,
        is_active: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    if username == "admin" && verify(password, &user.password_hash)? {
        let access_token = generate_token(&user, Duration::hours(1))?;
        let refresh_token = generate_token(&user, Duration::days(7))?;

        Ok(LoginResponse {
            access_token,
            refresh_token,
            user: user.into(),
        })
    } else {
        Err(anyhow::anyhow!("認証に失敗しました"))
    }
}

fn generate_token(user: &User, duration: Duration) -> Result<String> {
    let claims = Claims {
        sub: user.username.clone(),
        user_id: user.user_id,
        user_type: user.user_type.clone(),
        exp: (Utc::now() + duration).timestamp() as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret("your-secret-key-change-in-production".as_ref()),
    )?;

    Ok(token)
}

pub fn hash_password(password: &str) -> Result<String> {
    Ok(hash(password, DEFAULT_COST)?)
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool> {
    Ok(verify(password, hash)?)
}
