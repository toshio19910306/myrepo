use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Deserialize, Serialize};
use chrono::{Duration, Utc};
use sqlx::PgPool;

use crate::models::{User};
use crate::services::user_service_impl;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub user_id: i32,
    pub exp: usize,
}

pub async fn authenticate_user(pool: &PgPool, username: &str, password: &str) -> Result<LoginResponse> {
    let (user, password_hash) = user_service_impl::get_user_with_password(pool, username).await?
        .ok_or_else(|| anyhow::anyhow!("認証に失敗しました"))?;

    if verify(password, &password_hash)? {
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
