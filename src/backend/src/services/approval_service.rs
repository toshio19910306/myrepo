use anyhow::Result;
use chrono::Utc;

use crate::models::{
    ApprovalHistoryItem, ApprovalHistoryResponse, ApprovalHistoryTarget, ApprovalHistoryUser,
    PaginationInfo,
};

pub async fn get_approval_history_by_id(id: i32) -> Result<ApprovalHistoryResponse> {
    let approval_history = vec![
        ApprovalHistoryItem {
            id: 1,
            action_type: "申請".to_string(),
            processed_at: Utc::now(),
            user: ApprovalHistoryUser {
                full_name: "田中太郎".to_string(),
                department: Some("IT企画部".to_string()),
                position: Some("主任".to_string()),
            },
            comments: Some("見積依頼を申請します".to_string()),
            target: ApprovalHistoryTarget {
                r#type: "estimate_request".to_string(),
                id,
                title: "ECサイト構築プロジェクト".to_string(),
            },
        },
        ApprovalHistoryItem {
            id: 2,
            action_type: "承認".to_string(),
            processed_at: Utc::now(),
            user: ApprovalHistoryUser {
                full_name: "佐藤花子".to_string(),
                department: Some("IT企画部".to_string()),
                position: Some("課長".to_string()),
            },
            comments: Some("承認します".to_string()),
            target: ApprovalHistoryTarget {
                r#type: "estimate_request".to_string(),
                id,
                title: "ECサイト構築プロジェクト".to_string(),
            },
        },
    ];

    let pagination = PaginationInfo {
        current_page: 1,
        per_page: 20,
        total_count: 2,
        total_pages: 1,
    };

    Ok(ApprovalHistoryResponse {
        approval_history,
        pagination,
    })
}
