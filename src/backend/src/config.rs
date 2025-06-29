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
        let is_production = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()) == "production";
        
        let default_database_url = if is_production {
            "postgresql://estimate_user:estimate_password@localhost/estimate_request_db".to_string()
        } else {
            "postgresql://estimate_user:estimate_password@localhost/estimate_request_db".to_string()
        };
        
        let default_cors_origins = if is_production {
            "https://*.azurestaticapps.net,https://*.azurewebsites.net".to_string()
        } else {
            "http://localhost:3000,http://localhost:5173".to_string()
        };
        
        Ok(Config {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| default_database_url),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "production-jwt-secret-change-me".to_string()),
            blob_storage_connection_string: env::var("BLOB_STORAGE_CONNECTION_STRING")
                .unwrap_or_else(|_| "DefaultEndpointsProtocol=https;AccountName=estimaterequestsystem;UseDevelopmentStorage=false".to_string()),
            sendgrid_api_key: env::var("SENDGRID_API_KEY")
                .unwrap_or_else(|_| "".to_string()),
            cors_origins: env::var("CORS_ORIGINS")
                .unwrap_or_else(|_| default_cors_origins)
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
        })
    }
}
