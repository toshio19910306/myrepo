use anyhow::Result;
use chrono::Utc;
use sqlx::{PgPool, Row};

use crate::models::{ApprovalFlow, ApprovalStep, ApprovalHistory, CreateApprovalFlowRequest, ApprovalActionRequest};
// use crate::services::email_service::EmailService; // Temporarily disabled

pub async fn create_approval_flow(
    pool: &PgPool,
    request: CreateApprovalFlowRequest,
) -> Result<ApprovalFlow> {
    let approval_flow = sqlx::query_as::<_, ApprovalFlow>(
        "INSERT INTO approval_flows (target_type, target_id, current_step, status, created_by, created_at, updated_at)
         VALUES ($1, $2, 1, 'pending', $3, $4, $4)
         RETURNING flow_id, target_type, target_id, current_step, status, created_by, created_at, updated_at"
    )
    .bind(&request.target_type)
    .bind(request.target_id)
    .bind(request.created_by)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;

    for (index, approver_id) in request.approver_ids.iter().enumerate() {
        sqlx::query(
            "INSERT INTO approval_steps (flow_id, step_number, approver_id, status, created_at)
             VALUES ($1, $2, $3, 'pending', $4)"
        )
        .bind(approval_flow.flow_id)
        .bind((index + 1) as i32)
        .bind(approver_id)
        .bind(Utc::now())
        .execute(pool)
        .await?;
    }

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
        "SELECT step_id, flow_id, step_number, approver_id, status, comments, created_at, updated_at
         FROM approval_steps 
         WHERE flow_id = $1 AND step_number = (
             SELECT current_step FROM approval_flows WHERE flow_id = $1
         )"
    )
    .bind(flow_id)
    .fetch_one(&mut *tx)
    .await?;

    if current_step.approver_id != request.approver_id {
        return Err(anyhow::anyhow!("承認者が一致しません"));
    }

    sqlx::query(
        "UPDATE approval_steps 
         SET status = $1, comments = $2, updated_at = $3
         WHERE step_id = $4"
    )
    .bind(&request.action)
    .bind(&request.comments)
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
            "SELECT step_number FROM approval_steps 
             WHERE flow_id = $1 AND step_number > $2 AND status = 'pending'
             ORDER BY step_number LIMIT 1"
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
                 SET status = 'approved', updated_at = $1
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
             SET status = 'rejected', updated_at = $1
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
