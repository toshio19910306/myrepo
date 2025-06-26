use anyhow::Result;
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub blob_storage_connection_string: String,
    pub sendgrid_api_key: String,
    pub cors_origins: Vec<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Config {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "Server=localhost;Database=estimate_request;Trusted_Connection=true;".to_string()),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-secret-key-change-in-production".to_string()),
            blob_storage_connection_string: env::var("BLOB_STORAGE_CONNECTION_STRING")
                .unwrap_or_else(|_| "UseDevelopmentStorage=true".to_string()),
            sendgrid_api_key: env::var("SENDGRID_API_KEY")
                .unwrap_or_else(|_| "".to_string()),
            cors_origins: env::var("CORS_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000,http://localhost:5173".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
        })
    }
}
