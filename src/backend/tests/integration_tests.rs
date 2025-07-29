use axum::http::StatusCode;
use serde_json::json;
use sqlx::PgPool;
use std::collections::HashMap;

use crate::handlers::responses::*;
use crate::handlers::users::*;
use crate::models::estimate_response::EstimateResponse;
use crate::models::user::User;
use crate::services::estimate_response_service;
use crate::services::user_service;
use crate::AppState;

#[cfg(test)]
mod tests {
    use super::*;
    use axum::extract::{Query, State};
    use axum::Json;

    async fn setup_test_db() -> PgPool {
        let database_url = std::env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://estimate_user:estimate_password@localhost/estimate_request_test_db".to_string());
        
        PgPool::connect(&database_url)
            .await
            .expect("Failed to connect to test database")
    }

    #[tokio::test]
    async fn test_create_vendor_user() {
        let pool = setup_test_db().await;
        
        let create_request = user_service::CreateUserRequest {
            username: "test_vendor".to_string(),
            email: "test@vendor.com".to_string(),
            password: "password123".to_string(),
            full_name: "テストベンダー太郎".to_string(),
            department: Some("営業部".to_string()),
            position: Some("課長".to_string()),
            user_type: Some("VENDOR".to_string()),
            permissions: Some(vec!["READ_RESPONSES".to_string(), "WRITE_RESPONSES".to_string()]),
        };

        let result = user_service::create_user(&pool, create_request).await;
        assert!(result.is_ok());
        
        let user = result.unwrap();
        assert_eq!(user.username, "test_vendor");
        assert_eq!(user.user_type, "VENDOR");
        assert_eq!(user.full_name, "テストベンダー太郎");
    }

    #[tokio::test]
    async fn test_get_users_by_type_vendor() {
        let pool = setup_test_db().await;
        
        let create_request = user_service::CreateUserRequest {
            username: "vendor_filter_test".to_string(),
            email: "vendor_filter@test.com".to_string(),
            password: "password123".to_string(),
            full_name: "フィルターテストベンダー".to_string(),
            department: None,
            position: None,
            user_type: Some("VENDOR".to_string()),
            permissions: None,
        };

        let _user = user_service::create_user(&pool, create_request).await.unwrap();
        
        let vendors = user_service::get_users_by_type(&pool, Some("VENDOR".to_string())).await;
        assert!(vendors.is_ok());
        
        let vendor_list = vendors.unwrap();
        assert!(!vendor_list.is_empty());
        assert!(vendor_list.iter().all(|u| u.user_type == "VENDOR"));
    }

    #[tokio::test]
    async fn test_create_estimate_response() {
        let pool = setup_test_db().await;
        
        let response_data = EstimateResponse {
            response_id: 0, // Will be set by database
            request_id: Some(1),
            vendor_id: Some(1),
            estimate_number: Some("TEST-EST-001".to_string()),
            estimate_price: Some(1500000.0),
            total_amount: Some(1650000.0),
            breakdown: None,
            delivery_date: Some("2025-02-28".to_string()),
            validity_period: Some("30日間".to_string()),
            terms_conditions: Some("標準的な契約条件に従います".to_string()),
            response_remarks: Some("テスト用の見積回答です".to_string()),
            response_date: Some("2025-01-27".to_string()),
            status: "DRAFT".to_string(),
            created_by: 1,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let result = estimate_response_service::create_response(&pool, response_data).await;
        assert!(result.is_ok());
        
        let created_response = result.unwrap();
        assert_eq!(created_response.estimate_number, Some("TEST-EST-001".to_string()));
        assert_eq!(created_response.status, "DRAFT");
    }

    #[tokio::test]
    async fn test_update_estimate_response() {
        let pool = setup_test_db().await;
        
        let response_data = EstimateResponse {
            response_id: 0,
            request_id: Some(1),
            vendor_id: Some(1),
            estimate_number: Some("TEST-UPDATE-001".to_string()),
            estimate_price: Some(1000000.0),
            total_amount: Some(1100000.0),
            breakdown: None,
            delivery_date: Some("2025-03-15".to_string()),
            validity_period: Some("45日間".to_string()),
            terms_conditions: Some("更新テスト用".to_string()),
            response_remarks: Some("更新前のコメント".to_string()),
            response_date: Some("2025-01-27".to_string()),
            status: "DRAFT".to_string(),
            created_by: 1,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let created = estimate_response_service::create_response(&pool, response_data).await.unwrap();
        
        let mut updated_data = created.clone();
        updated_data.estimate_price = Some(1200000.0);
        updated_data.response_remarks = Some("更新後のコメント".to_string());
        updated_data.status = "SUBMITTED".to_string();

        let result = estimate_response_service::update_response(&pool, created.response_id, updated_data).await;
        assert!(result.is_ok());
        
        let updated_response = result.unwrap();
        assert_eq!(updated_response.estimate_price, Some(1200000.0));
        assert_eq!(updated_response.response_remarks, Some("更新後のコメント".to_string()));
        assert_eq!(updated_response.status, "SUBMITTED");
    }

    #[tokio::test]
    async fn test_approve_response() {
        let pool = setup_test_db().await;
        
        let response_data = EstimateResponse {
            response_id: 0,
            request_id: Some(1),
            vendor_id: Some(1),
            estimate_number: Some("TEST-APPROVE-001".to_string()),
            estimate_price: Some(2000000.0),
            total_amount: Some(2200000.0),
            breakdown: None,
            delivery_date: Some("2025-04-30".to_string()),
            validity_period: Some("60日間".to_string()),
            terms_conditions: Some("承認テスト用".to_string()),
            response_remarks: Some("承認待ちの見積回答".to_string()),
            response_date: Some("2025-01-27".to_string()),
            status: "SUBMITTED".to_string(),
            created_by: 1,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let created = estimate_response_service::create_response(&pool, response_data).await.unwrap();
        
        let result = estimate_response_service::approve_response(&pool, created.response_id, 1).await;
        assert!(result.is_ok());
        
        let approved_response = result.unwrap();
        assert_eq!(approved_response.status, "APPROVED");
    }

    #[tokio::test]
    async fn test_reject_response() {
        let pool = setup_test_db().await;
        
        let response_data = EstimateResponse {
            response_id: 0,
            request_id: Some(1),
            vendor_id: Some(1),
            estimate_number: Some("TEST-REJECT-001".to_string()),
            estimate_price: Some(3000000.0),
            total_amount: Some(3300000.0),
            breakdown: None,
            delivery_date: Some("2025-05-31".to_string()),
            validity_period: Some("90日間".to_string()),
            terms_conditions: Some("差し戻しテスト用".to_string()),
            response_remarks: Some("差し戻し対象の見積回答".to_string()),
            response_date: Some("2025-01-27".to_string()),
            status: "SUBMITTED".to_string(),
            created_by: 1,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let created = estimate_response_service::create_response(&pool, response_data).await.unwrap();
        
        let result = estimate_response_service::reject_response(&pool, created.response_id, 1).await;
        assert!(result.is_ok());
        
        let rejected_response = result.unwrap();
        assert_eq!(rejected_response.status, "REJECTED");
    }

    #[tokio::test]
    async fn test_get_pending_approvals() {
        let pool = setup_test_db().await;
        
        let submitted_response = EstimateResponse {
            response_id: 0,
            request_id: Some(1),
            vendor_id: Some(1),
            estimate_number: Some("TEST-PENDING-001".to_string()),
            estimate_price: Some(1800000.0),
            total_amount: Some(1980000.0),
            breakdown: None,
            delivery_date: Some("2025-06-15".to_string()),
            validity_period: Some("30日間".to_string()),
            terms_conditions: Some("承認待ちテスト".to_string()),
            response_remarks: Some("承認待ちの見積回答1".to_string()),
            response_date: Some("2025-01-27".to_string()),
            status: "SUBMITTED".to_string(),
            created_by: 1,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let _created = estimate_response_service::create_response(&pool, submitted_response).await.unwrap();
        
        let result = estimate_response_service::get_pending_approvals(&pool).await;
        assert!(result.is_ok());
        
        let pending_list = result.unwrap();
        assert!(!pending_list.is_empty());
        
        for approval in pending_list {
            assert_eq!(approval.get("status").unwrap().as_str().unwrap(), "SUBMITTED");
        }
    }
}
