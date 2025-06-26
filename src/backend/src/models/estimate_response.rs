use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EstimateResponse {
    pub response_id: i32,
    pub request_id: i32,
    pub estimate_number: Option<String>,
    pub estimate_price: Option<rust_decimal::Decimal>,
    pub response_remarks: Option<String>,
    pub response_date: Option<chrono::NaiveDate>,
    pub status: String,
    pub created_by: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateEstimateResponseRequest {
    pub request_id: i32,
    #[validate(length(max = 50))]
    pub estimate_number: Option<String>,
    pub estimate_price: Option<f64>,
    pub response_remarks: Option<String>,
    pub response_date: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateEstimateResponseRequest {
    #[validate(length(max = 50))]
    pub estimate_number: Option<String>,
    pub estimate_price: Option<f64>,
    pub response_remarks: Option<String>,
    pub response_date: Option<String>,
}
