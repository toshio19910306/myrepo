use anyhow::Result;
use chrono::Utc;

use crate::models::{
    ApprovalHistoryItem, ApprovalHistoryQuery, ApprovalHistoryResponse, ApprovalHistoryTarget,
    ApprovalHistoryUser, PaginationInfo,
};

pub async fn get_approval_history(query: ApprovalHistoryQuery) -> Result<ApprovalHistoryResponse> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);

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
                id: 123,
                title: "ECサイト構築プロジェクト".to_string(),
            },
        },
        ApprovalHistoryItem {
            id: 2,
            action_type: "上程".to_string(),
            processed_at: Utc::now(),
            user: ApprovalHistoryUser {
                full_name: "鈴木次郎".to_string(),
                department: Some("IT企画部".to_string()),
                position: Some("係長".to_string()),
            },
            comments: Some("上程いたします".to_string()),
            target: ApprovalHistoryTarget {
                r#type: "estimate_request".to_string(),
                id: 123,
                title: "ECサイト構築プロジェクト".to_string(),
            },
        },
        ApprovalHistoryItem {
            id: 3,
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
                id: 123,
                title: "ECサイト構築プロジェクト".to_string(),
            },
        },
        ApprovalHistoryItem {
            id: 4,
            action_type: "差し戻し".to_string(),
            processed_at: Utc::now(),
            user: ApprovalHistoryUser {
                full_name: "山田三郎".to_string(),
                department: Some("IT企画部".to_string()),
                position: Some("部長".to_string()),
            },
            comments: Some("内容を再検討してください".to_string()),
            target: ApprovalHistoryTarget {
                r#type: "estimate_response".to_string(),
                id: 456,
                title: "モバイルアプリ開発".to_string(),
            },
        },
    ];

    let filtered_history: Vec<ApprovalHistoryItem> = approval_history
        .into_iter()
        .filter(|item| {
            if let Some(ref action_type) = query.action_type {
                if item.action_type != *action_type {
                    return false;
                }
            }
            if let Some(ref target_type) = query.target_type {
                if item.target.r#type != *target_type {
                    return false;
                }
            }
            if let Some(target_id) = query.target_id {
                if item.target.id != target_id {
                    return false;
                }
            }
            if let Some(ref department) = query.department {
                if let Some(ref user_dept) = item.user.department {
                    if !user_dept.contains(department) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            if let Some(ref position) = query.position {
                if let Some(ref user_pos) = item.user.position {
                    if !user_pos.contains(position) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            if let Some(ref approver_name) = query.approver_name {
                if !item.user.full_name.contains(approver_name) {
                    return false;
                }
            }
            true
        })
        .collect();

    let total_count = filtered_history.len() as u64;
    let total_pages = ((total_count as f64) / (per_page as f64)).ceil() as u32;

    let start_index = ((page - 1) * per_page) as usize;
    let end_index = (start_index + per_page as usize).min(filtered_history.len());
    let paginated_history = filtered_history[start_index..end_index].to_vec();

    let pagination = PaginationInfo {
        current_page: page,
        per_page,
        total_count,
        total_pages,
    };

    Ok(ApprovalHistoryResponse {
        approval_history: paginated_history,
        pagination,
    })
}
