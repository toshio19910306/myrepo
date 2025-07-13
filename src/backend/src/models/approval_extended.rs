use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ApprovalStep {
    pub step_id: i32,
    pub flow_id: i32,
    pub step_number: i32,
    pub approver_id: i32,
    pub status: String,
    pub comments: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ApprovalHistory {
    pub history_id: i32,
    pub flow_id: i32,
    pub step_number: i32,
    pub approver_id: i32,
    pub action: String,
    pub comments: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateApprovalFlowRequest {
    pub target_type: String,
    pub target_id: i32,
    pub approver_ids: Vec<i32>,
    pub created_by: i32,
}

#[derive(Debug, Deserialize)]
pub struct ApprovalActionRequest {
    pub approver_id: i32,
    pub action: String,
    pub comments: Option<String>,
}
