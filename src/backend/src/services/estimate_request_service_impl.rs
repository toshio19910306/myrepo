use anyhow::Result;
use chrono::{Utc, NaiveDate, TimeZone};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::models::{EstimateRequest, CreateEstimateRequestRequest, UpdateEstimateRequestRequest};

pub async fn get_all_requests(pool: &PgPool, page: i32, per_page: i32) -> Result<Vec<EstimateRequest>> {
    let offset = (page - 1) * per_page;
    
    let requests = sqlx::query_as::<_, EstimateRequest>(
        "SELECT request_id, spec_id, subject, description, deadline, budget_range_min, budget_range_max, requirements, vendor_name, status, created_by, created_at, updated_at 
         FROM estimate_requests 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2"
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(pool)
    .await?;

    Ok(requests)
}

pub async fn get_request_by_id(pool: &PgPool, request_id: i32) -> Result<Option<EstimateRequest>> {
    let request = sqlx::query_as::<_, EstimateRequest>(
        "SELECT request_id, spec_id, subject, description, deadline, budget_range_min, budget_range_max, requirements, vendor_name, status, created_by, created_at, updated_at 
         FROM estimate_requests 
         WHERE request_id = $1"
    )
    .bind(request_id)
    .fetch_optional(pool)
    .await?;

    Ok(request)
}

pub async fn create_request(pool: &PgPool, request: CreateEstimateRequestRequest) -> Result<EstimateRequest> {
    let deadline = if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(&request.deadline) {
        dt.with_timezone(&Utc)
    } else if let Ok(date) = NaiveDate::parse_from_str(&request.deadline, "%Y-%m-%d") {
        Utc.from_utc_datetime(&date.and_hms_opt(23, 59, 59).unwrap())
    } else {
        return Err(anyhow::anyhow!("Invalid deadline format: {}", request.deadline));
    };
    
    let created_by = request.created_by;
    
    let estimate_request = sqlx::query_as::<_, EstimateRequest>(
        "INSERT INTO estimate_requests (spec_id, subject, description, deadline, budget_range_min, budget_range_max, requirements, vendor_name, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', $9, $10, $10)
         RETURNING request_id, spec_id, subject, description, deadline, budget_range_min, budget_range_max, requirements, vendor_name, status, created_by, created_at, updated_at"
    )
    .bind(request.spec_id)
    .bind(&request.subject)
    .bind(&request.description)
    .bind(deadline)
    .bind(&request.budget_range_min)
    .bind(&request.budget_range_max)
    .bind(&request.requirements)
    .bind(&request.vendor_name)
    .bind(created_by)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;

    if let Some(attachment_ids) = request.attachment_ids {
        for file_id in attachment_ids {
            if let Ok(uuid) = Uuid::parse_str(&file_id) {
                let _ = sqlx::query(
                    "UPDATE attached_files SET target_type = 'REQUEST', target_id = $1 WHERE file_id = $2"
                )
                .bind(estimate_request.request_id)
                .bind(uuid)
                .execute(pool)
                .await;
            }
        }
    }

    Ok(estimate_request)
}

pub async fn update_request(pool: &PgPool, request_id: i32, request: UpdateEstimateRequestRequest) -> Result<Option<EstimateRequest>> {
    let deadline = if let Some(deadline_str) = &request.deadline {
        if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(deadline_str) {
            Some(dt.with_timezone(&Utc))
        } else if let Ok(date) = NaiveDate::parse_from_str(deadline_str, "%Y-%m-%d") {
            Some(Utc.from_utc_datetime(&date.and_hms_opt(23, 59, 59).unwrap()))
        } else {
            return Err(anyhow::anyhow!("Invalid deadline format: {}", deadline_str));
        }
    } else {
        None
    };

    let estimate_request = sqlx::query_as::<_, EstimateRequest>(
        "UPDATE estimate_requests 
         SET spec_id = COALESCE($2, spec_id), subject = COALESCE($3, subject), description = COALESCE($4, description), deadline = COALESCE($5, deadline), budget_range_min = COALESCE($6, budget_range_min), budget_range_max = COALESCE($7, budget_range_max), requirements = COALESCE($8, requirements), vendor_name = COALESCE($9, vendor_name), status = COALESCE($10, status), updated_at = $11
         WHERE request_id = $1
         RETURNING request_id, spec_id, subject, description, deadline, budget_range_min, budget_range_max, requirements, vendor_name, status, created_by, created_at, updated_at"
    )
    .bind(request_id)
    .bind(&request.spec_id)
    .bind(&request.subject)
    .bind(&request.description)
    .bind(&deadline)
    .bind(&request.budget_range_min)
    .bind(&request.budget_range_max)
    .bind(&request.requirements)
    .bind(&request.vendor_name)
    .bind(&request.status)
    .bind(Utc::now())
    .fetch_optional(pool)
    .await?;

    Ok(estimate_request)
}

pub async fn delete_request(pool: &PgPool, request_id: i32) -> Result<bool> {
    let result = sqlx::query(
        "DELETE FROM estimate_requests WHERE request_id = $1"
    )
    .bind(request_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}


pub async fn submit_request(pool: &PgPool, request_id: i32) -> Result<Option<EstimateRequest>> {
    let estimate_request = sqlx::query_as::<_, EstimateRequest>(
        "UPDATE estimate_requests 
         SET status = 'SUBMITTED', updated_at = $2
         WHERE request_id = $1
         RETURNING request_id, spec_id, subject, description, deadline, budget_range_min, budget_range_max, requirements, vendor_name, status, created_by, created_at, updated_at"
    )
    .bind(request_id)
    .bind(Utc::now())
    .fetch_optional(pool)
    .await?;

    Ok(estimate_request)
}

pub async fn get_approved_requests(pool: &PgPool) -> Result<Vec<EstimateRequest>> {
    let requests = sqlx::query_as::<_, EstimateRequest>(
        "SELECT request_id, spec_id, subject, description, deadline, 
                budget_range_min, budget_range_max, requirements, vendor_name, status, 
                created_by, created_at, updated_at
         FROM estimate_requests 
         WHERE status IN ('RESPONDED', 'SUBMITTED')
         ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;

    Ok(requests)
}

pub async fn copy_request(pool: &PgPool, request_id: i32, created_by: i32) -> Result<Option<EstimateRequest>> {
    let original_request = get_request_by_id(pool, request_id).await?;
    
    if let Some(original) = original_request {
        let new_request = sqlx::query_as::<_, EstimateRequest>(
            "INSERT INTO estimate_requests (spec_id, subject, description, deadline, budget_range_min, budget_range_max, requirements, vendor_name, status, created_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', $9, $10, $10)
             RETURNING request_id, spec_id, subject, description, deadline, budget_range_min, budget_range_max, requirements, vendor_name, status, created_by, created_at, updated_at"
        )
        .bind(original.spec_id)
        .bind(&format!("{} (コピー)", original.subject))
        .bind(&original.description)
        .bind(&original.deadline)
        .bind(&original.budget_range_min)
        .bind(&original.budget_range_max)
        .bind(&original.requirements)
        .bind(&original.vendor_name)
        .bind(created_by)
        .bind(Utc::now())
        .fetch_one(pool)
        .await?;

        Ok(Some(new_request))
    } else {
        Ok(None)
    }
}

pub async fn get_approved_requests_for_vendor(pool: &PgPool) -> Result<Vec<EstimateRequest>> {
    get_approved_requests(pool).await
}
