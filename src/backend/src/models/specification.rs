use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Specification {
    pub spec_id: i32,
    pub spec_number: String,
    pub title: String,
    pub work_items: String,
    pub deliverables: String,
    pub desired_delivery_date: Option<chrono::NaiveDate>,
    pub delivery_location: Option<String>,
    pub acceptance_conditions: Option<String>,
    pub estimate_copies: Option<i32>,
    pub supplied_items: Option<String>,
    pub loaned_items: Option<String>,
    pub applicable_standards: Option<String>,
    pub special_notes: Option<String>,
    pub status: String,
    pub created_by: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateSpecificationRequest {
    #[validate(length(min = 1, max = 50))]
    pub spec_number: String,
    #[validate(length(min = 1, max = 200))]
    pub title: String,
    pub work_items: Vec<String>,
    pub deliverables: Vec<String>,
    pub desired_delivery_date: Option<String>,
    #[validate(length(max = 200))]
    pub delivery_location: Option<String>,
    pub acceptance_conditions: Option<String>,
    pub estimate_copies: Option<i32>,
    pub supplied_items: Option<String>,
    pub loaned_items: Option<String>,
    pub applicable_standards: Option<String>,
    pub special_notes: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateSpecificationRequest {
    #[validate(length(min = 1, max = 200))]
    pub title: Option<String>,
    pub work_items: Option<Vec<String>>,
    pub deliverables: Option<Vec<String>>,
    pub desired_delivery_date: Option<String>,
    #[validate(length(max = 200))]
    pub delivery_location: Option<String>,
    pub acceptance_conditions: Option<String>,
    pub estimate_copies: Option<i32>,
    pub supplied_items: Option<String>,
    pub loaned_items: Option<String>,
    pub applicable_standards: Option<String>,
    pub special_notes: Option<String>,
}
