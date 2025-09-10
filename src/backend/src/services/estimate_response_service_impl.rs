use anyhow::Result;
use chrono::Utc;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::models::{EstimateResponse, CreateEstimateResponseRequest, UpdateEstimateResponseRequest};

pub async fn get_all_responses(pool: &PgPool, page: i32, per_page: i32) -> Result<Vec<EstimateResponse>> {
    let offset = (page - 1) * per_page;
    
    let responses = sqlx::query_as::<_, EstimateResponse>(
        "SELECT response_id, request_id, company_id, estimate_number, estimate_price, total_amount, breakdown, delivery_date, validity_period, terms_conditions, response_remarks, response_date, status, created_by, created_at, updated_at 
         FROM estimate_responses 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2"
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(pool)
    .await?;

    Ok(responses)
}

pub async fn get_response_by_id(pool: &PgPool, response_id: i32) -> Result<Option<EstimateResponse>> {
    let response = sqlx::query_as::<_, EstimateResponse>(
        "SELECT response_id, request_id, company_id, estimate_number, estimate_price, total_amount, breakdown, delivery_date, validity_period, terms_conditions, response_remarks, response_date, status, created_by, created_at, updated_at 
         FROM estimate_responses 
         WHERE response_id = $1"
    )
    .bind(response_id)
    .fetch_optional(pool)
    .await?;

    Ok(response)
}

pub async fn create_response(pool: &PgPool, request: CreateEstimateResponseRequest) -> Result<EstimateResponse> {
    let delivery_date = request.delivery_date
        .as_ref()
        .map(|date_str| chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d"))
        .transpose()
        .map_err(|e| anyhow::anyhow!("Invalid date format for delivery_date: {}", e))?;

    let response_date = request.response_date
        .as_ref()
        .map(|date_str| chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d"))
        .transpose()
        .map_err(|e| anyhow::anyhow!("Invalid date format for response_date: {}", e))?;

    let estimate_response = sqlx::query_as::<_, EstimateResponse>(
        "INSERT INTO estimate_responses (request_id, company_id, estimate_number, estimate_price, total_amount, breakdown, delivery_date, validity_period, terms_conditions, response_remarks, response_date, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'DRAFT', $12, $13, $13)
         RETURNING response_id, request_id, company_id, estimate_number, estimate_price, total_amount, breakdown, delivery_date, validity_period, terms_conditions, response_remarks, response_date, status, created_by, created_at, updated_at"
    )
    .bind(request.request_id)
    .bind(request.company_id)
    .bind(&request.estimate_number)
    .bind(&request.estimate_price)
    .bind(&request.total_amount)
    .bind(&request.breakdown.as_ref().map(|b| serde_json::to_string(b)).transpose()?)
    .bind(delivery_date)
    .bind(&request.validity_period)
    .bind(&request.terms_conditions)
    .bind(&request.response_remarks)
    .bind(response_date)
    .bind(request.created_by)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;

    if let Some(attachment_ids) = request.attachment_ids {
        for file_id in attachment_ids {
            if let Ok(uuid) = Uuid::parse_str(&file_id) {
                let _ = sqlx::query(
                    "UPDATE attached_files SET target_type = 'RESPONSE', target_id = $1 WHERE file_id = $2"
                )
                .bind(estimate_response.response_id)
                .bind(uuid)
                .execute(pool)
                .await;
            }
        }
    }

    Ok(estimate_response)
}

pub async fn update_response(pool: &PgPool, response_id: i32, request: UpdateEstimateResponseRequest) -> Result<Option<EstimateResponse>> {
    let delivery_date = request.delivery_date
        .as_ref()
        .map(|date_str| chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d"))
        .transpose()
        .map_err(|e| anyhow::anyhow!("Invalid date format for delivery_date: {}", e))?;

    let response_date = request.response_date
        .as_ref()
        .map(|date_str| chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d"))
        .transpose()
        .map_err(|e| anyhow::anyhow!("Invalid date format for response_date: {}", e))?;

    let estimate_response = sqlx::query_as::<_, EstimateResponse>(
        "UPDATE estimate_responses 
         SET request_id = COALESCE($2, request_id), company_id = COALESCE($3, company_id), estimate_number = COALESCE($4, estimate_number), estimate_price = COALESCE($5, estimate_price), total_amount = COALESCE($6, total_amount), breakdown = COALESCE($7, breakdown), delivery_date = COALESCE($8, delivery_date), validity_period = COALESCE($9, validity_period), terms_conditions = COALESCE($10, terms_conditions), response_remarks = COALESCE($11, response_remarks), response_date = COALESCE($12, response_date), status = COALESCE($13, status), updated_at = $14
         WHERE response_id = $1
         RETURNING response_id, request_id, company_id, estimate_number, estimate_price, total_amount, breakdown, delivery_date, validity_period, terms_conditions, response_remarks, response_date, status, created_by, created_at, updated_at"
    )
    .bind(response_id)
    .bind(&request.request_id)
    .bind(&request.company_id)
    .bind(&request.estimate_number)
    .bind(&request.estimate_price)
    .bind(&request.total_amount)
    .bind(&request.breakdown.as_ref().map(|b| serde_json::to_string(b)).transpose()?)
    .bind(delivery_date)
    .bind(&request.validity_period)
    .bind(&request.terms_conditions)
    .bind(&request.response_remarks)
    .bind(response_date)
    .bind(&request.status)
    .bind(Utc::now())
    .fetch_optional(pool)
    .await?;

    if let Some(attachment_ids) = request.attachment_ids {
        for file_id in attachment_ids {
            if let Ok(uuid) = Uuid::parse_str(&file_id) {
                let _ = sqlx::query(
                    "UPDATE attached_files SET target_type = 'RESPONSE', target_id = $1 WHERE file_id = $2"
                )
                .bind(response_id)
                .bind(uuid)
                .execute(pool)
                .await;
            }
        }
    }

    Ok(estimate_response)
}

pub async fn delete_response(pool: &PgPool, response_id: i32) -> Result<bool> {
    let result = sqlx::query(
        "DELETE FROM estimate_responses WHERE response_id = $1"
    )
    .bind(response_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn submit_response(pool: &PgPool, response_id: i32) -> Result<Option<EstimateResponse>> {
    let estimate_response = sqlx::query_as::<_, EstimateResponse>(
        "UPDATE estimate_responses 
         SET status = 'SUBMITTED', updated_at = $2
         WHERE response_id = $1
         RETURNING response_id, request_id, company_id, estimate_number, estimate_price, total_amount, breakdown, delivery_date, validity_period, terms_conditions, response_remarks, response_date, status, created_by, created_at, updated_at"
    )
    .bind(response_id)
    .bind(Utc::now())
    .fetch_optional(pool)
    .await?;

    Ok(estimate_response)
}
