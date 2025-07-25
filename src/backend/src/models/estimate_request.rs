use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EstimateRequest {
    pub request_id: i32,
    pub spec_id: Option<i32>,
    pub subject: String,
    pub description: Option<String>,
    pub deadline: DateTime<Utc>,
    pub budget_range_min: Option<Decimal>,
    pub budget_range_max: Option<Decimal>,
    pub requirements: Option<String>,
    pub vendor_name: Option<String>,
    pub status: String,
    pub created_by: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateEstimateRequestRequest {
    pub spec_id: Option<i32>,
    #[validate(length(min = 1, max = 200))]
    pub subject: String,
    #[validate(length(min = 1))]
    pub description: String,
    #[validate(length(min = 1))]
    pub deadline: String,
    pub budget_range_min: Option<Decimal>,
    pub budget_range_max: Option<Decimal>,
    pub requirements: Option<String>,
    pub vendor_name: Option<String>,
    pub created_by: i32,
    pub attachment_ids: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateEstimateRequestRequest {
    pub spec_id: Option<i32>,
    #[validate(length(min = 1, max = 200))]
    pub subject: Option<String>,
    pub description: Option<String>,
    pub deadline: Option<String>,
    pub budget_range_min: Option<Decimal>,
    pub budget_range_max: Option<Decimal>,
    pub requirements: Option<String>,
    pub vendor_name: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CopyEstimateRequestRequest {
    #[validate(length(min = 1, max = 200))]
    pub new_subject: String,
}
