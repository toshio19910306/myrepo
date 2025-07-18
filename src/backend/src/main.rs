use axum::{
    extract::State,
    http::{header, HeaderValue, Method, StatusCode},
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::{json, Value};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, Level};
use tracing_subscriber;
use sqlx::PgPool;

mod config;
mod models;
mod handlers {
    pub mod users;
    pub mod specifications;
    pub mod requests;
    pub mod responses;
    pub mod approvals;
    pub mod approval_history;
    pub mod files;
    // pub mod auth; // Temporarily disabled
}
mod services {
    pub mod specification_service;
    pub mod specification_service_impl;
    pub mod estimate_request_service;
    pub mod estimate_request_service_impl;
    pub mod estimate_response_service;
    pub mod estimate_response_service_impl;
    pub mod approval_service;
    pub mod approval_service_impl;
    pub mod file_service;
    pub mod user_service;
    pub mod user_service_impl;
    // pub mod auth_service; // Temporarily disabled
    // pub mod email_service; // Temporarily disabled
}
mod middleware;
mod utils;
mod database;

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db_pool: PgPool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv::dotenv().ok();
    
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .init();

    let config = Arc::new(Config::from_env()?);
    
    info!("Connecting to database: {}", config.database_url);
    let db_pool = database::create_pool(&config.database_url).await?;
    
    info!("Running database migrations...");
    database::run_migrations(&db_pool).await?;
    
    let app_state = AppState { 
        config,
        db_pool,
    };

    let frontend_url = std::env::var("FRONTEND_URL")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());
    
    let cors_origin = if frontend_url.contains("@") {
        let parts: Vec<&str> = frontend_url.split("@").collect();
        if parts.len() == 2 {
            format!("https://{}", parts[1])
        } else {
            frontend_url.clone()
        }
    } else {
        frontend_url.clone()
    };
    
    let cors = CorsLayer::new()
        .allow_origin(cors_origin.parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION])
        .allow_credentials(true);

    let app = Router::new()
        .route("/", get(health_check))
        .route("/health", get(health_check))
        // .nest("/api/auth", handlers::auth::routes()) // Temporarily disabled
        .nest("/api/users", handlers::users::routes())
        .nest("/api/specifications", handlers::specifications::routes())
        .nest("/api/requests", handlers::requests::routes())
        .nest("/api/responses", handlers::responses::routes())
        .nest("/api/approvals", handlers::approvals::routes())
        .nest("/api/approval-history", handlers::approval_history::routes())
        .nest("/api/files", handlers::files::routes())
        .layer(cors)
        .with_state(app_state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8000".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    info!("Starting server on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> Result<Json<Value>, StatusCode> {
    Ok(Json(json!({
        "status": "healthy",
        "service": "estimate-request-backend",
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}
