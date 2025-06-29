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

#[derive(Debug, Serialize, Deserialize)]
pub struct SpecificationResponse {
    pub spec_id: i32,
    pub spec_number: String,
    pub title: String,
    pub work_items: Vec<String>,
    pub deliverables: Vec<String>,
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

impl From<Specification> for SpecificationResponse {
    fn from(spec: Specification) -> Self {
        let work_items: Vec<String> = serde_json::from_str(&spec.work_items).unwrap_or_default();
        let deliverables: Vec<String> = serde_json::from_str(&spec.deliverables).unwrap_or_default();
        
        SpecificationResponse {
            spec_id: spec.spec_id,
            spec_number: spec.spec_number,
            title: spec.title,
            work_items,
            deliverables,
            desired_delivery_date: spec.desired_delivery_date,
            delivery_location: spec.delivery_location,
            acceptance_conditions: spec.acceptance_conditions,
            estimate_copies: spec.estimate_copies,
            supplied_items: spec.supplied_items,
            loaned_items: spec.loaned_items,
            applicable_standards: spec.applicable_standards,
            special_notes: spec.special_notes,
            status: spec.status,
            created_by: spec.created_by,
            created_at: spec.created_at,
            updated_at: spec.updated_at,
        }
    }
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
    pub created_by: i32,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateSpecificationRequest {
    pub spec_number: Option<String>,
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
    pub status: Option<String>,
}
