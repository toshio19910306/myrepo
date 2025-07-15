use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EstimateResponse {
    pub response_id: i32,
    pub request_id: i32,
    pub vendor_id: Option<i32>,
    pub estimate_number: Option<String>,
    pub estimate_price: Option<Decimal>,
    pub total_amount: Option<Decimal>,
    pub breakdown: Option<String>,
    pub delivery_date: Option<DateTime<Utc>>,
    pub validity_period: Option<i32>,
    pub terms_conditions: Option<String>,
    pub response_remarks: Option<String>,
    pub response_date: Option<DateTime<Utc>>,
    pub status: String,
    pub created_by: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateEstimateResponseRequest {
    pub request_id: i32,
    pub vendor_id: i32,
    pub total_amount: Decimal,
    pub breakdown: Option<String>,
    pub delivery_date: String,
    #[validate(range(min = 1))]
    pub validity_period: i32,
    pub notes: Option<String>,
    pub attachment_ids: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateEstimateResponseRequest {
    pub request_id: Option<i32>,
    pub vendor_id: Option<i32>,
    #[validate(length(max = 50))]
    pub estimate_number: Option<String>,
    pub estimate_price: Option<Decimal>,
    pub total_amount: Option<Decimal>,
    pub breakdown: Option<String>,
    pub delivery_date: Option<String>,
    pub validity_period: Option<i32>,
    pub terms_conditions: Option<String>,
    pub response_remarks: Option<String>,
    pub response_date: Option<String>,
    pub status: Option<String>,
}
