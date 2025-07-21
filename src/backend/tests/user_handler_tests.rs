#[cfg(test)]
mod tests {
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        Router,
    };
    use tower::ServiceExt;
    use serde_json::{json, Value};
    use sqlx::PgPool;
    use std::env;
    use std::sync::Arc;

    use estimate_request_backend::handlers::users;
    use estimate_request_backend::{AppState, config::Config};

    async fn setup_test_app() -> (Router, PgPool) {
        let database_url = env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://postgres:password@localhost/test_db".to_string());
        
        let pool = PgPool::connect(&database_url).await.expect("Failed to connect to test database");
        
        sqlx::query("TRUNCATE TABLE approval_steps, approval_history, approval_flows, attached_files, estimate_responses, estimate_requests, specifications, users RESTART IDENTITY CASCADE")
            .execute(&pool)
            .await
            .expect("Failed to clean test database");

        let config = Arc::new(Config::from_env().unwrap_or_else(|_| Config {
            database_url: database_url.clone(),
            jwt_secret: "test_secret".to_string(),
            blob_storage_connection_string: "test_blob_connection".to_string(),
            sendgrid_api_key: "test_sendgrid_key".to_string(),
            cors_origins: vec!["http://localhost:3000".to_string()],
        }));

        let state = AppState { 
            config,
            db_pool: pool.clone() 
        };
        let app = users::routes().with_state(state);
        
        (app, pool)
    }

    #[tokio::test]
    async fn test_create_user_endpoint_excludes_user_type_from_request() {
        let (app, _pool) = setup_test_app().await;

        let payload = json!({
            "username": "apitest",
            "email": "apitest@example.com",
            "password": "password123",
            "full_name": "API Test User",
            "department": "Engineering",
            "position": "Developer"
        });

        let request = Request::builder()
            .method("POST")
            .uri("/")
            .header("content-type", "application/json")
            .body(Body::from(payload.to_string()))
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let response_json: Value = serde_json::from_slice(&body).unwrap();
        
        assert!(response_json["success"].as_bool().unwrap());
        assert_eq!(response_json["data"]["user_type"].as_str().unwrap(), "IT");
        assert_eq!(response_json["data"]["username"].as_str().unwrap(), "apitest");
    }

    #[tokio::test]
    async fn test_get_users_endpoint_includes_user_type() {
        let (app, pool) = setup_test_app().await;

        sqlx::query(
            "INSERT INTO users (username, email, password_hash, full_name, user_type, is_active, created_at, updated_at)
             VALUES ('testuser', 'test@example.com', 'hash', 'Test User', 'IT', true, NOW(), NOW())"
        )
        .execute(&pool)
        .await
        .unwrap();

        let request = Request::builder()
            .method("GET")
            .uri("/")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let response_json: Value = serde_json::from_slice(&body).unwrap();
        
        assert!(response_json["success"].as_bool().unwrap());
        let users = response_json["data"].as_array().unwrap();
        assert!(!users.is_empty());
        assert_eq!(users[0]["user_type"].as_str().unwrap(), "IT");
    }

    #[tokio::test]
    async fn test_get_user_by_id_endpoint_includes_user_type() {
        let (app, pool) = setup_test_app().await;

        let user_id: i32 = sqlx::query_scalar(
            "INSERT INTO users (username, email, password_hash, full_name, user_type, is_active, created_at, updated_at)
             VALUES ('testuser2', 'test2@example.com', 'hash', 'Test User 2', 'IT', true, NOW(), NOW())
             RETURNING user_id"
        )
        .fetch_one(&pool)
        .await
        .unwrap();

        let request = Request::builder()
            .method("GET")
            .uri(&format!("/{}", user_id))
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let response_json: Value = serde_json::from_slice(&body).unwrap();
        
        assert!(response_json["success"].as_bool().unwrap());
        assert_eq!(response_json["data"]["user_type"].as_str().unwrap(), "IT");
        assert_eq!(response_json["data"]["user_id"].as_i64().unwrap(), user_id as i64);
    }

    #[tokio::test]
    async fn test_update_user_endpoint_includes_user_type() {
        let (app, pool) = setup_test_app().await;

        let user_id: i32 = sqlx::query_scalar(
            "INSERT INTO users (username, email, password_hash, full_name, user_type, is_active, created_at, updated_at)
             VALUES ('updateuser', 'update@example.com', 'hash', 'Update User', 'IT', true, NOW(), NOW())
             RETURNING user_id"
        )
        .fetch_one(&pool)
        .await
        .unwrap();

        let payload = json!({
            "full_name": "Updated User Name",
            "email": "updated@example.com"
        });

        let request = Request::builder()
            .method("PUT")
            .uri(&format!("/{}", user_id))
            .header("content-type", "application/json")
            .body(Body::from(payload.to_string()))
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let response_json: Value = serde_json::from_slice(&body).unwrap();
        
        assert!(response_json["success"].as_bool().unwrap());
        assert_eq!(response_json["data"]["user_type"].as_str().unwrap(), "IT");
        assert_eq!(response_json["data"]["full_name"].as_str().unwrap(), "Updated User Name");
    }

    #[tokio::test]
    async fn test_get_approvers_endpoint_includes_user_type() {
        let (app, pool) = setup_test_app().await;

        sqlx::query(
            "INSERT INTO users (username, email, password_hash, full_name, position, user_type, is_active, created_at, updated_at)
             VALUES ('manager', 'manager@example.com', 'hash', 'Manager User', '部長', 'IT', true, NOW(), NOW())"
        )
        .execute(&pool)
        .await
        .unwrap();

        let request = Request::builder()
            .method("GET")
            .uri("/approvers")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let response_json: Value = serde_json::from_slice(&body).unwrap();
        
        assert!(response_json["success"].as_bool().unwrap());
        let approvers = response_json["data"].as_array().unwrap();
        if !approvers.is_empty() {
            assert_eq!(approvers[0]["user_type"].as_str().unwrap(), "IT");
        }
    }

    #[tokio::test]
    async fn test_delete_user_endpoint() {
        let (app, pool) = setup_test_app().await;

        let user_id: i32 = sqlx::query_scalar(
            "INSERT INTO users (username, email, password_hash, full_name, user_type, is_active, created_at, updated_at)
             VALUES ('deleteuser', 'delete@example.com', 'hash', 'Delete User', 'IT', true, NOW(), NOW())
             RETURNING user_id"
        )
        .fetch_one(&pool)
        .await
        .unwrap();

        let request = Request::builder()
            .method("DELETE")
            .uri(&format!("/{}", user_id))
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let response_json: Value = serde_json::from_slice(&body).unwrap();
        
        assert!(response_json["success"].as_bool().unwrap());
        assert_eq!(response_json["data"]["user_id"].as_i64().unwrap(), user_id as i64);
    }
}
