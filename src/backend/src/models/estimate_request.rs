use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EstimateRequest {
    pub request_id: i32,
    pub spec_id: Option<i32>,
    pub request_number: String,
    pub revision: i32,
    pub subject: String,
    pub request_date: chrono::NaiveDate,
    pub deadline: chrono::NaiveDate,
    pub order_content: String,
    pub remarks: Option<String>,
    pub assignee_id: i32,
    pub vendor_id: i32,
    pub status: String,
    pub created_by: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateEstimateRequestRequest {
    pub spec_id: Option<i32>,
    #[validate(length(min = 1, max = 50))]
    pub request_number: String,
    #[validate(length(min = 1, max = 200))]
    pub subject: String,
    pub request_date: String,
    pub deadline: String,
    #[validate(length(min = 1))]
    pub order_content: String,
    pub remarks: Option<String>,
    pub assignee_id: i32,
    pub vendor_id: i32,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateEstimateRequestRequest {
    #[validate(length(min = 1, max = 200))]
    pub subject: Option<String>,
    pub request_date: Option<String>,
    pub deadline: Option<String>,
    pub order_content: Option<String>,
    pub remarks: Option<String>,
    pub assignee_id: Option<i32>,
    pub vendor_id: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct CopyEstimateRequestRequest {
    #[validate(length(min = 1, max = 50))]
    pub new_request_number: String,
    #[validate(length(min = 1, max = 200))]
    pub new_subject: String,
}
