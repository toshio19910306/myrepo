use anyhow::Result;
use chrono::Utc;
use sqlx::PgPool;

use crate::models::company::{Company, CreateCompanyRequest, UpdateCompanyRequest};

pub async fn get_all_companies(pool: &PgPool) -> Result<Vec<Company>> {
    let companies = sqlx::query_as::<_, Company>(
        "SELECT company_id, company_name, is_active, created_at, updated_at 
         FROM companies 
         WHERE is_active = true
         ORDER BY company_name ASC"
    )
    .fetch_all(pool)
    .await?;

    Ok(companies)
}

pub async fn get_company_by_id(pool: &PgPool, company_id: i32) -> Result<Option<Company>> {
    let company = sqlx::query_as::<_, Company>(
        "SELECT company_id, company_name, is_active, created_at, updated_at 
         FROM companies 
         WHERE company_id = $1 AND is_active = true"
    )
    .bind(company_id)
    .fetch_optional(pool)
    .await?;

    Ok(company)
}

pub async fn create_company(pool: &PgPool, request: CreateCompanyRequest) -> Result<Company> {
    let company = sqlx::query_as::<_, Company>(
        "INSERT INTO companies (company_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4)
         RETURNING company_id, company_name, is_active, created_at, updated_at"
    )
    .bind(&request.company_name)
    .bind(true)
    .bind(Utc::now())
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;

    Ok(company)
}

pub async fn update_company(pool: &PgPool, company_id: i32, request: UpdateCompanyRequest) -> Result<Option<Company>> {
    let company = sqlx::query_as::<_, Company>(
        "UPDATE companies SET 
         company_name = COALESCE($2, company_name),
         updated_at = $3
         WHERE company_id = $1 AND is_active = true
         RETURNING company_id, company_name, is_active, created_at, updated_at"
    )
    .bind(company_id)
    .bind(&request.company_name)
    .bind(Utc::now())
    .fetch_optional(pool)
    .await?;

    Ok(company)
}

pub async fn delete_company(pool: &PgPool, company_id: i32) -> Result<bool> {
    let result = sqlx::query(
        "UPDATE companies SET is_active = false, updated_at = $2 WHERE company_id = $1 AND is_active = true"
    )
    .bind(company_id)
    .bind(Utc::now())
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
