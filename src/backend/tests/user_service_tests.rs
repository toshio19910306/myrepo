#[cfg(test)]
mod tests {
    use estimate_request_backend::services::user_service::{CreateUserRequest, UpdateUserRequest};
    use sqlx::PgPool;
    use std::env;

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
    async fn test_create_user_defaults_to_it_user_type() {
        let pool = setup_test_db().await;
        
        let request = CreateUserRequest {
            username: "testuser_service".to_string(),
            email: "test@example.com".to_string(),
            password: "password123".to_string(),
            full_name: "Test User".to_string(),
            department: Some("Engineering".to_string()),
            position: Some("Developer".to_string()),
            permissions: None,
        };

        let result = estimate_request_backend::services::user_service::create_user(&pool, request).await;
        assert!(result.is_ok());
        
        let user = result.unwrap();
        assert_eq!(user.user_type, "IT");
        assert_eq!(user.username, "testuser_service");
        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.full_name, "Test User");
        assert_eq!(user.department, Some("Engineering".to_string()));
        assert_eq!(user.position, Some("Developer".to_string()));
        assert!(user.is_active);
    }

    #[tokio::test]
    async fn test_get_user_by_id_includes_user_type() {
        let pool = setup_test_db().await;
        
        let request = CreateUserRequest {
            username: "testuser2_service".to_string(),
            email: "test2@example.com".to_string(),
            password: "password123".to_string(),
            full_name: "Test User 2".to_string(),
            department: None,
            position: None,
            permissions: None,
        };

        let created_user = estimate_request_backend::services::user_service::create_user(&pool, request).await.unwrap();
        
        let result = estimate_request_backend::services::user_service::get_user_by_id(&pool, created_user.user_id).await;
        assert!(result.is_ok());
        
        let user = result.unwrap().unwrap();
        assert_eq!(user.user_type, "IT");
        assert_eq!(user.user_id, created_user.user_id);
    }

    #[tokio::test]
    async fn test_get_all_users_includes_user_type() {
        let pool = setup_test_db().await;
        
        let request1 = CreateUserRequest {
            username: "user1_service".to_string(),
            email: "user1@example.com".to_string(),
            password: "password123".to_string(),
            full_name: "User One".to_string(),
            department: Some("IT".to_string()),
            position: Some("Manager".to_string()),
            permissions: None,
        };

        let request2 = CreateUserRequest {
            username: "user2_service".to_string(),
            email: "user2@example.com".to_string(),
            password: "password123".to_string(),
            full_name: "User Two".to_string(),
            department: Some("HR".to_string()),
            position: Some("Specialist".to_string()),
            permissions: None,
        };

        estimate_request_backend::services::user_service::create_user(&pool, request1).await.unwrap();
        estimate_request_backend::services::user_service::create_user(&pool, request2).await.unwrap();
        
        let result = estimate_request_backend::services::user_service::get_all_users(&pool, 1, 10).await;
        assert!(result.is_ok());
        
        let users = result.unwrap();
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let test_users: Vec<_> = users.into_iter()
            .filter(|u| u.username == "user1_service" || u.username == "user2_service")
            .collect();
        assert!(test_users.len() >= 2, "Expected at least 2 users, found {}", test_users.len());
        
        for user in test_users {
            assert_eq!(user.user_type, "IT");
        }
    }

    #[tokio::test]
    async fn test_update_user_preserves_user_type() {
        let pool = setup_test_db().await;
        
        let create_request = CreateUserRequest {
            username: "updateuser_service".to_string(),
            email: "update@example.com".to_string(),
            password: "password123".to_string(),
            full_name: "Update User".to_string(),
            department: Some("Engineering".to_string()),
            position: Some("Developer".to_string()),
            permissions: None,
        };

        let created_user = estimate_request_backend::services::user_service::create_user(&pool, create_request).await.unwrap();
        
        let update_request = UpdateUserRequest {
            full_name: Some("Updated User".to_string()),
            email: Some("updated@example.com".to_string()),
            department: Some("Product".to_string()),
            position: Some("Senior Developer".to_string()),
        };

        let result = estimate_request_backend::services::user_service::update_user(&pool, created_user.user_id, update_request).await;
        assert!(result.is_ok());
        
        let updated_user = result.unwrap().unwrap();
        assert_eq!(updated_user.user_type, "IT");
        assert_eq!(updated_user.full_name, "Updated User");
        assert_eq!(updated_user.email, "updated@example.com");
        assert_eq!(updated_user.department, Some("Product".to_string()));
        assert_eq!(updated_user.position, Some("Senior Developer".to_string()));
    }

    #[tokio::test]
    async fn test_delete_user_soft_delete() {
        let pool = setup_test_db().await;
        
        let request = CreateUserRequest {
            username: "deleteuser_service".to_string(),
            email: "delete@example.com".to_string(),
            password: "password123".to_string(),
            full_name: "Delete User".to_string(),
            department: None,
            position: None,
            permissions: None,
        };

        let created_user = estimate_request_backend::services::user_service::create_user(&pool, request).await.unwrap();
        
        let result = estimate_request_backend::services::user_service::delete_user(&pool, created_user.user_id).await;
        assert!(result.is_ok());
        assert!(result.unwrap());
        
        let deleted_user = estimate_request_backend::services::user_service::get_user_by_id(&pool, created_user.user_id).await.unwrap();
        assert!(deleted_user.is_none());
    }

    #[tokio::test]
    async fn test_create_user_request_excludes_user_type() {
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
    }
}
