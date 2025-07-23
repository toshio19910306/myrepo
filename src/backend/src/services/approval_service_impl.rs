use anyhow::Result;
use chrono::Utc;
use sqlx::{PgPool, Row};

use crate::models::{ApprovalFlow, CreateApprovalFlowRequest, ApprovalActionRequest};
use crate::models::approval_extended::{ApprovalStep, ApprovalHistory};
// use crate::services::email_service::EmailService; // Temporarily disabled

pub async fn create_approval_flow(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    request: CreateApprovalFlowRequest,
) -> Result<ApprovalFlow> {
    println!("About to insert approval flow");
    let query = sqlx::query_as::<_, ApprovalFlow>(
        "INSERT INTO approval_flows (target_type, target_id, current_step, status, created_by, created_at, updated_at)
         VALUES ($1, $2, 1, 'PENDING', $3, $4, $4)
         RETURNING flow_id, target_type, target_id, current_step, status, created_by, created_at, updated_at"
    )
    .bind(&request.target_type)
    .bind(request.target_id)
    .bind(request.created_by)
    .bind(Utc::now());
    
    println!("Query prepared, about to execute fetch_one");
    let approval_flow = match query.fetch_one(&mut **tx).await {
        Ok(flow) => {
            println!("fetch_one completed successfully, flow_id: {}", flow.flow_id);
            flow
        },
        Err(e) => {
            println!("fetch_one failed with error: {:?}", e);
            return Err(e.into());
        }
    };
    
    println!("Successfully inserted approval flow with ID: {}", approval_flow.flow_id);
    println!("Creating approval steps for {} approvers", request.approver_ids.len());
    for (index, approver_id) in request.approver_ids.iter().enumerate() {
        println!("Inserting approval step {} for approver {}", index + 1, approver_id);
        sqlx::query(
            "INSERT INTO approval_steps (flow_id, step_order, approver_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $4)"
        )
        .bind(approval_flow.flow_id)
        .bind((index + 1) as i32)
        .bind(approver_id)
        .bind(Utc::now())
        .execute(&mut **tx)
        .await?;
        println!("Successfully inserted approval step {} for approver {}", index + 1, approver_id);
    }
    println!("All approval steps created successfully");

    Ok(approval_flow)
}

pub async fn process_approval_action(
    pool: &PgPool,
    // email_service: &EmailService, // Temporarily disabled
    flow_id: i32,
    request: ApprovalActionRequest,
) -> Result<ApprovalFlow> {
    let mut tx = pool.begin().await?;

    let current_step = sqlx::query_as::<_, ApprovalStep>(
        "SELECT step_id, flow_id, step_order as step_number, approver_id, 
                COALESCE(action_type, 'PENDING') as status, comments, created_at, updated_at
         FROM approval_steps 
         WHERE flow_id = $1 AND step_order = (
             SELECT current_step FROM approval_flows WHERE flow_id = $1
         )"
    )
    .bind(flow_id)
    .fetch_one(&mut *tx)
    .await?;

    if current_step.approver_id != request.approver_id {
        return Err(anyhow::anyhow!("承認者が一致しません"));
    }

    let action_type = match request.action.as_str() {
        "approved" => "APPROVE",
        "rejected" => "REJECT",
        _ => return Err(anyhow::anyhow!("無効なアクションです: {}", request.action)),
    };

    sqlx::query(
        "UPDATE approval_steps 
         SET action_type = $1, comments = $2, approved_at = $3, updated_at = $4
         WHERE step_id = $5"
    )
    .bind(action_type)
    .bind(&request.comments)
    .bind(Utc::now())
    .bind(Utc::now())
    .bind(current_step.step_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "INSERT INTO approval_history (flow_id, step_number, approver_id, action, comments, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)"
    )
    .bind(flow_id)
    .bind(current_step.step_number)
    .bind(request.approver_id)
    .bind(&request.action)
    .bind(&request.comments)
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;

    let approval_flow = if request.action == "approved" {
        let next_step = sqlx::query_scalar::<_, Option<i32>>(
            "SELECT step_order FROM approval_steps 
             WHERE flow_id = $1 AND step_order > $2 AND action_type IS NULL
             ORDER BY step_order LIMIT 1"
        )
        .bind(flow_id)
        .bind(current_step.step_number)
        .fetch_optional(&mut *tx)
        .await?;

        if let Some(next_step_number) = next_step {
            sqlx::query_as::<_, ApprovalFlow>(
                "UPDATE approval_flows 
                 SET current_step = $1, updated_at = $2
                 WHERE flow_id = $3
                 RETURNING flow_id, target_type, target_id, current_step, status, created_by, created_at, updated_at"
            )
            .bind(next_step_number)
            .bind(Utc::now())
            .bind(flow_id)
            .fetch_one(&mut *tx)
            .await?
        } else {
            sqlx::query_as::<_, ApprovalFlow>(
                "UPDATE approval_flows 
                 SET status = 'APPROVED', updated_at = $1
                 WHERE flow_id = $2
                 RETURNING flow_id, target_type, target_id, current_step, status, created_by, created_at, updated_at"
            )
            .bind(Utc::now())
            .bind(flow_id)
            .fetch_one(&mut *tx)
            .await?
        }
    } else {
        sqlx::query_as::<_, ApprovalFlow>(
            "UPDATE approval_flows 
             SET status = 'REJECTED', updated_at = $1
             WHERE flow_id = $2
             RETURNING flow_id, target_type, target_id, current_step, status, created_by, created_at, updated_at"
        )
        .bind(Utc::now())
        .bind(flow_id)
        .fetch_one(&mut *tx)
        .await?
    };

    tx.commit().await?;

    Ok(approval_flow)
}

pub async fn get_approval_history(
    pool: &PgPool,
    flow_id: i32,
) -> Result<Vec<ApprovalHistory>> {
    let history = sqlx::query_as::<_, ApprovalHistory>(
        "SELECT history_id, flow_id, step_number, approver_id, action, comments, created_at
         FROM approval_history
         WHERE flow_id = $1
         ORDER BY step_number, created_at"
    )
    .bind(flow_id)
    .fetch_all(pool)
    .await?;

    Ok(history)
}
