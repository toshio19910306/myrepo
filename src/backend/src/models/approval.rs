use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ApprovalFlow {
    pub flow_id: i32,
    pub target_type: String,
    pub target_id: i32,
    pub current_step: i32,
    pub status: String,
    pub created_by: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ApprovalStep {
    pub step_id: i32,
    pub flow_id: i32,
    pub step_number: i32,
    pub approver_id: i32,
    pub step_name: String,
    pub action_type: String,
    pub status: String,
    pub approved_at: Option<DateTime<Utc>>,
    pub comments: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApprovalHistoryItem {
    pub id: i32,
    pub action_type: String,
    pub processed_at: DateTime<Utc>,
    pub user: ApprovalHistoryUser,
    pub comments: Option<String>,
    pub target: ApprovalHistoryTarget,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApprovalHistoryUser {
    pub full_name: String,
    pub department: Option<String>,
    pub position: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApprovalHistoryTarget {
    pub r#type: String,
    pub id: i32,
    pub title: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ApprovalHistoryQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub target_type: Option<String>,
    pub target_id: Option<i32>,
    pub action_type: Option<String>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub department: Option<String>,
    pub position: Option<String>,
    pub approver_name: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ApprovalHistoryResponse {
    pub approval_history: Vec<ApprovalHistoryItem>,
    pub pagination: PaginationInfo,
}

#[derive(Debug, Serialize)]
pub struct PaginationInfo {
    pub current_page: u32,
    pub per_page: u32,
    pub total_count: u64,
    pub total_pages: u32,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ApprovalActionRequest {
    pub approver_id: i32,
    pub action: String,
    #[validate(length(max = 1000))]
    pub comments: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ApprovalActionResponse {
    pub success: bool,
    pub message: String,
    pub approval_step: ApprovalStep,
}
