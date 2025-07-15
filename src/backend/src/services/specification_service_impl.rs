use anyhow::Result;
use chrono::Utc;
use sqlx::{PgPool, Row};

use crate::models::{Specification, CreateSpecificationRequest, UpdateSpecificationRequest};

pub async fn get_all_specifications(pool: &PgPool, page: i32, per_page: i32) -> Result<Vec<Specification>> {
    let offset = (page - 1) * per_page;
    
    let specifications = sqlx::query_as::<_, Specification>(
        "SELECT spec_id, spec_number, title, work_items, deliverables, desired_delivery_date, delivery_location, acceptance_conditions, estimate_copies, supplied_items, loaned_items, applicable_standards, special_notes, status, created_by, created_at, updated_at 
         FROM specifications 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2"
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(pool)
    .await?;

    Ok(specifications)
}

pub async fn get_specification_by_id(pool: &PgPool, spec_id: i32) -> Result<Option<Specification>> {
    let specification = sqlx::query_as::<_, Specification>(
        "SELECT spec_id, spec_number, title, work_items, deliverables, desired_delivery_date, delivery_location, acceptance_conditions, estimate_copies, supplied_items, loaned_items, applicable_standards, special_notes, status, created_by, created_at, updated_at 
         FROM specifications 
         WHERE spec_id = $1"
    )
    .bind(spec_id)
    .fetch_optional(pool)
    .await?;

    Ok(specification)
}

pub async fn create_specification(pool: &PgPool, request: CreateSpecificationRequest) -> Result<Specification> {
    let desired_delivery_date = request.desired_delivery_date
        .as_ref()
        .map(|date_str| chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d"))
        .transpose()
        .map_err(|e| anyhow::anyhow!("Invalid date format for desired_delivery_date: {}", e))?;

    let specification = sqlx::query_as::<_, Specification>(
        "INSERT INTO specifications (spec_number, title, work_items, deliverables, desired_delivery_date, delivery_location, acceptance_conditions, estimate_copies, supplied_items, loaned_items, applicable_standards, special_notes, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'DRAFT', $13, $14, $14)
         RETURNING spec_id, spec_number, title, work_items, deliverables, desired_delivery_date, delivery_location, acceptance_conditions, estimate_copies, supplied_items, loaned_items, applicable_standards, special_notes, status, created_by, created_at, updated_at"
    )
    .bind(&request.spec_number)
    .bind(&request.title)
    .bind(serde_json::to_string(&request.work_items)?)
    .bind(serde_json::to_string(&request.deliverables)?)
    .bind(desired_delivery_date)
    .bind(&request.delivery_location)
    .bind(&request.acceptance_conditions)
    .bind(&request.estimate_copies)
    .bind(&request.supplied_items)
    .bind(&request.loaned_items)
    .bind(&request.applicable_standards)
    .bind(&request.special_notes)
    .bind(request.created_by)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;

    Ok(specification)
}

pub async fn update_specification(pool: &PgPool, spec_id: i32, request: UpdateSpecificationRequest) -> Result<Option<Specification>> {
    let desired_delivery_date = request.desired_delivery_date
        .as_ref()
        .map(|date_str| chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d"))
        .transpose()
        .map_err(|e| anyhow::anyhow!("Invalid date format for desired_delivery_date: {}", e))?;

    let specification = sqlx::query_as::<_, Specification>(
        "UPDATE specifications 
         SET spec_number = COALESCE($2, spec_number), title = COALESCE($3, title), work_items = COALESCE($4, work_items), deliverables = COALESCE($5, deliverables), desired_delivery_date = COALESCE($6, desired_delivery_date), delivery_location = COALESCE($7, delivery_location), acceptance_conditions = COALESCE($8, acceptance_conditions), estimate_copies = COALESCE($9, estimate_copies), supplied_items = COALESCE($10, supplied_items), loaned_items = COALESCE($11, loaned_items), applicable_standards = COALESCE($12, applicable_standards), special_notes = COALESCE($13, special_notes), status = COALESCE($14, status), updated_at = $15
         WHERE spec_id = $1
         RETURNING spec_id, spec_number, title, work_items, deliverables, desired_delivery_date, delivery_location, acceptance_conditions, estimate_copies, supplied_items, loaned_items, applicable_standards, special_notes, status, created_by, created_at, updated_at"
    )
    .bind(spec_id)
    .bind(&request.spec_number)
    .bind(&request.title)
    .bind(&request.work_items.as_ref().map(|w| serde_json::to_string(w)).transpose()?)
    .bind(&request.deliverables.as_ref().map(|d| serde_json::to_string(d)).transpose()?)
    .bind(desired_delivery_date)
    .bind(&request.delivery_location)
    .bind(&request.acceptance_conditions)
    .bind(&request.estimate_copies)
    .bind(&request.supplied_items)
    .bind(&request.loaned_items)
    .bind(&request.applicable_standards)
    .bind(&request.special_notes)
    .bind(&request.status)
    .bind(Utc::now())
    .fetch_optional(pool)
    .await?;

    Ok(specification)
}

pub async fn delete_specification(pool: &PgPool, spec_id: i32) -> Result<bool> {
    println!("DEBUG: Attempting to delete specification with ID: {}", spec_id);
    
    let request_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM estimate_requests WHERE spec_id = $1"
    )
    .bind(spec_id)
    .fetch_one(pool)
    .await?;

    println!("DEBUG: Found {} estimate requests referencing spec_id {}", request_count, spec_id);

    if request_count > 0 {
        println!("DEBUG: Cannot delete specification - has {} related estimate requests", request_count);
        return Err(anyhow::anyhow!(
            "この仕様書は見積依頼で使用されているため削除できません。関連する見積依頼を先に削除してください。"
        ));
    }

    let file_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM attached_files WHERE target_type = 'SPECIFICATION' AND target_id = $1"
    )
    .bind(spec_id)
    .fetch_one(pool)
    .await?;

    println!("DEBUG: Found {} attached files for spec_id {}", file_count, spec_id);

    if file_count > 0 {
        println!("DEBUG: Deleting {} attached files first", file_count);
        sqlx::query(
            "DELETE FROM attached_files WHERE target_type = 'SPECIFICATION' AND target_id = $1"
        )
        .bind(spec_id)
        .execute(pool)
        .await?;
    }

    println!("DEBUG: Attempting to delete specification from database");
    let result = sqlx::query(
        "DELETE FROM specifications WHERE spec_id = $1"
    )
    .bind(spec_id)
    .execute(pool)
    .await?;

    let success = result.rows_affected() > 0;
    println!("DEBUG: Delete result - rows affected: {}, success: {}", result.rows_affected(), success);

    Ok(success)
}

pub async fn submit_specification(pool: &PgPool, spec_id: i32) -> Result<Option<Specification>> {
    let specification = sqlx::query_as::<_, Specification>(
        "UPDATE specifications 
         SET status = 'submitted', updated_at = $2
         WHERE spec_id = $1
         RETURNING spec_id, spec_number, title, work_items, deliverables, desired_delivery_date, delivery_location, acceptance_conditions, estimate_copies, supplied_items, loaned_items, applicable_standards, special_notes, status, created_by, created_at, updated_at"
    )
    .bind(spec_id)
    .bind(Utc::now())
    .fetch_optional(pool)
    .await?;

    Ok(specification)
}

pub async fn get_work_items() -> Result<Vec<serde_json::Value>> {
    let work_items = vec![
        serde_json::json!({ "id": 1, "name": "基本構想立案", "description": "プロジェクトの基本構想を立案する" }),
        serde_json::json!({ "id": 2, "name": "要件定義", "description": "システムの要件を定義する" }),
        serde_json::json!({ "id": 3, "name": "AP外部設計", "description": "アプリケーションの外部設計を行う" }),
        serde_json::json!({ "id": 4, "name": "ＡＰ内部設計", "description": "アプリケーションの内部設計を行う" }),
        serde_json::json!({ "id": 5, "name": "AP製造", "description": "アプリケーションの製造を行う" }),
        serde_json::json!({ "id": 6, "name": "プログラムテスト（単体テスト)", "description": "プログラムの単体テストを実施する" }),
        serde_json::json!({ "id": 7, "name": "AP結合テスト", "description": "アプリケーションの結合テストを実施する" }),
        serde_json::json!({ "id": 8, "name": "システムテスト", "description": "システム全体のテストを実施する" }),
        serde_json::json!({ "id": 9, "name": "システム受入支援・移行", "description": "システムの受入支援と移行作業を行う" }),
        serde_json::json!({ "id": 10, "name": "運用保守", "description": "システムの運用保守を行う" }),
    ];
    
    Ok(work_items)
}

pub async fn get_deliverables() -> Result<Vec<serde_json::Value>> {
    let deliverables = vec![
        serde_json::json!({ "id": 1, "name": "基本構想書", "description": "プロジェクトの基本構想をまとめた文書" }),
        serde_json::json!({ "id": 2, "name": "要件定義書", "description": "システムの要件を定義した文書" }),
        serde_json::json!({ "id": 3, "name": "外部設計書", "description": "システムの外部設計をまとめた文書" }),
        serde_json::json!({ "id": 4, "name": "内部設計書", "description": "システムの内部設計をまとめた文書" }),
        serde_json::json!({ "id": 5, "name": "プログラム仕様書", "description": "プログラムの仕様をまとめた文書" }),
        serde_json::json!({ "id": 6, "name": "単体テスト仕様書", "description": "単体テストの仕様をまとめた文書" }),
        serde_json::json!({ "id": 7, "name": "単体テスト結果報告書", "description": "単体テストの結果をまとめた報告書" }),
        serde_json::json!({ "id": 8, "name": "結合テスト仕様書", "description": "結合テストの仕様をまとめた文書" }),
        serde_json::json!({ "id": 9, "name": "結合テスト結果報告書", "description": "結合テストの結果をまとめた報告書" }),
        serde_json::json!({ "id": 10, "name": "システムテスト仕様書", "description": "システムテストの仕様をまとめた文書" }),
        serde_json::json!({ "id": 11, "name": "システムテスト結果報告書", "description": "システムテストの結果をまとめた報告書" }),
        serde_json::json!({ "id": 12, "name": "受入テスト仕様書", "description": "受入テストの仕様をまとめた文書" }),
        serde_json::json!({ "id": 13, "name": "受入テスト結果報告書", "description": "受入テストの結果をまとめた報告書" }),
        serde_json::json!({ "id": 14, "name": "運用手順書", "description": "システムの運用手順をまとめた文書" }),
        serde_json::json!({ "id": 15, "name": "保守手順書", "description": "システムの保守手順をまとめた文書" }),
        serde_json::json!({ "id": 16, "name": "ユーザーマニュアル", "description": "システムのユーザーマニュアル" }),
        serde_json::json!({ "id": 17, "name": "システム管理者マニュアル", "description": "システム管理者向けのマニュアル" }),
        serde_json::json!({ "id": 18, "name": "移行計画書", "description": "システム移行の計画をまとめた文書" }),
        serde_json::json!({ "id": 19, "name": "移行手順書", "description": "システム移行の手順をまとめた文書" }),
        serde_json::json!({ "id": 20, "name": "移行結果報告書", "description": "システム移行の結果をまとめた報告書" }),
        serde_json::json!({ "id": 21, "name": "教育資料", "description": "システム利用者向けの教育資料" }),
        serde_json::json!({ "id": 22, "name": "教育実施報告書", "description": "教育実施の結果をまとめた報告書" }),
        serde_json::json!({ "id": 23, "name": "プロジェクト完了報告書", "description": "プロジェクト完了をまとめた報告書" }),
        serde_json::json!({ "id": 24, "name": "成果物一覧", "description": "プロジェクトで作成した成果物の一覧" }),
    ];
    
    Ok(deliverables)
}
