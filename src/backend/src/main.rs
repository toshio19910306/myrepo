use axum::{
    extract::State,
    http::{header, Method, StatusCode},
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::{json, Value};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, Level};
use tracing_subscriber;

mod config;
mod models;
mod handlers;
mod services;
mod middleware;
mod utils;

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv::dotenv().ok();
    
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .init();

    let config = Arc::new(Config::from_env()?);
    let app_state = AppState { config };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let app = Router::new()
        .route("/", get(health_check))
        .route("/health", get(health_check))
        .nest("/api/auth", handlers::auth::routes())
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
