use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Company {
    pub company_id: i32,
    pub company_name: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateCompanyRequest {
    #[validate(length(min = 1, max = 200))]
    pub company_name: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateCompanyRequest {
    #[validate(length(min = 1, max = 200))]
    pub company_name: Option<String>,
}
