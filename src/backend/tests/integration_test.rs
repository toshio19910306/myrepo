#[cfg(test)]
mod tests {
    use std::env;
    use sqlx::PgPool;

    async fn setup_test_db() -> PgPool {
        let database_url = env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://postgres:password@localhost/test_db".to_string());
        
        let pool = PgPool::connect(&database_url).await.expect("Failed to connect to test database");
        
        sqlx::query("TRUNCATE TABLE approval_steps, approval_history, approval_flows, attached_files, estimate_responses, estimate_requests, specifications, users RESTART IDENTITY CASCADE")
            .execute(&pool)
            .await
            .expect("Failed to clean test database");
            
        pool
    }

    #[tokio::test]
    async fn test_user_type_field_verification() {
        let pool = setup_test_db().await;
        
        let user_id: i32 = sqlx::query_scalar(
            "INSERT INTO users (username, email, password_hash, full_name, user_type, is_active, created_at, updated_at)
             VALUES ('testuser_integration', 'test_integration@example.com', 'hash', 'Test User', 'IT', true, NOW(), NOW())
             RETURNING user_id"
        )
        .fetch_one(&pool)
        .await
        .unwrap();

        let user: (String,) = sqlx::query_as(
            "SELECT user_type FROM users WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_one(&pool)
        .await
        .unwrap();

        assert_eq!(user.0, "IT");
    }

    #[tokio::test]
    async fn test_create_user_request_structure() {
        use estimate_request_backend::services::user_service::CreateUserRequest;
        
        let request = CreateUserRequest {
            username: "test".to_string(),
            email: "test@example.com".to_string(),
            password: "password".to_string(),
            full_name: "Test".to_string(),
            department: None,
            position: None,
            permissions: None,
        };
        
        let serialized = serde_json::to_string(&request).unwrap();
        assert!(!serialized.contains("user_type"));
        assert!(serialized.contains("username"));
        assert!(serialized.contains("email"));
        assert!(serialized.contains("full_name"));
    }
}
