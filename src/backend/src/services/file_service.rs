use anyhow::Result;
use axum::extract::{Multipart, multipart::Field};
use chrono::Utc;
use sqlx::{PgPool, Row};
use std::path::Path;
use tokio::fs;
use uuid::Uuid;

use crate::models::{AttachedFile, FileUploadResponse};

pub async fn upload_file(
    pool: &PgPool,
    mut multipart: Multipart,
    target_type: &str,
    target_id: i32,
    uploaded_by: i32,
) -> Result<FileUploadResponse> {
    if let Some(field) = multipart.next_field().await? {
        let _name = field.name().unwrap_or("file");
        let filename = field.file_name().unwrap_or("unknown").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();
        let data = field.bytes().await?;

        let file_size = data.len() as i64;
        if file_size > 10 * 1024 * 1024 {
            return Err(anyhow::anyhow!("ファイルサイズが10MBを超えています"));
        }

        let allowed_types = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "application/zip",
        ];

        if !allowed_types.contains(&content_type.as_str()) {
            return Err(anyhow::anyhow!("サポートされていないファイル形式です"));
        }

        let file_id = Uuid::new_v4();
        let stored_filename = format!("{}_{}", file_id, filename);
        let upload_dir = "uploads";
        
        fs::create_dir_all(upload_dir).await?;
        let file_path = Path::new(upload_dir).join(&stored_filename);
        fs::write(&file_path, &data).await?;

        let blob_url = format!("/api/files/{}", file_id);

        let attached_file = sqlx::query_as::<_, AttachedFile>(
            "INSERT INTO attached_files (file_id, target_type, target_id, original_filename, stored_filename, file_size, content_type, blob_url, uploaded_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING file_id, target_type, target_id, original_filename, stored_filename, file_size, content_type, blob_url, uploaded_by, created_at"
        )
        .bind(file_id)
        .bind(target_type)
        .bind(target_id)
        .bind(&filename)
        .bind(&stored_filename)
        .bind(file_size)
        .bind(&content_type)
        .bind(&blob_url)
        .bind(uploaded_by)
        .bind(Utc::now())
        .fetch_one(pool)
        .await?;

        return Ok(FileUploadResponse {
            file_id: attached_file.file_id,
            filename: attached_file.original_filename,
            size: attached_file.file_size,
            content_type: attached_file.content_type,
            url: attached_file.blob_url,
        });
    }

    Err(anyhow::anyhow!("ファイルが見つかりません"))
}

pub async fn get_file_by_id(pool: &PgPool, file_id: Uuid) -> Result<Option<AttachedFile>> {
    let file = sqlx::query_as::<_, AttachedFile>(
        "SELECT file_id, target_type, target_id, original_filename, stored_filename, file_size, content_type, blob_url, uploaded_by, created_at
         FROM attached_files
         WHERE file_id = $1"
    )
    .bind(file_id)
    .fetch_optional(pool)
    .await?;

    Ok(file)
}

pub async fn delete_file(pool: &PgPool, file_id: Uuid) -> Result<bool> {
    let file = get_file_by_id(pool, file_id).await?;
    
    if let Some(file) = file {
        let file_path = Path::new("uploads").join(&file.stored_filename);
        if file_path.exists() {
            fs::remove_file(file_path).await?;
        }

        let result = sqlx::query(
            "DELETE FROM attached_files WHERE file_id = $1"
        )
        .bind(file_id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    } else {
        Ok(false)
    }
}

pub async fn get_files_by_target(pool: &PgPool, target_type: &str, target_id: i32) -> Result<Vec<AttachedFile>> {
    let files = sqlx::query_as::<_, AttachedFile>(
        "SELECT file_id, target_type, target_id, original_filename, stored_filename, file_size, content_type, blob_url, uploaded_by, created_at
         FROM attached_files
         WHERE target_type = $1 AND target_id = $2
         ORDER BY created_at DESC"
    )
    .bind(target_type)
    .bind(target_id)
    .fetch_all(pool)
    .await?;

    Ok(files)
}

pub async fn get_all_files(pool: &PgPool) -> Result<Vec<AttachedFile>> {
    let files = sqlx::query_as::<_, AttachedFile>(
        "SELECT file_id, target_type, target_id, original_filename, stored_filename, file_size, content_type, blob_url, uploaded_by, created_at
         FROM attached_files
         ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;

    Ok(files)
}

pub async fn upload_file_from_field(
    pool: &PgPool,
    field: Field<'_>,
    target_type: &str,
    target_id: i32,
    uploaded_by: i32,
) -> Result<AttachedFile> {
    let filename = field.file_name().unwrap_or("unknown").to_string();
    let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();
    let data = field.bytes().await?;

    let file_size = data.len() as i64;
    if file_size > 10 * 1024 * 1024 {
        return Err(anyhow::anyhow!("ファイルサイズが10MBを超えています"));
    }

    let allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/csv",
        "application/zip",
    ];

    if !allowed_types.contains(&content_type.as_str()) {
        return Err(anyhow::anyhow!("サポートされていないファイル形式です"));
    }

    let file_id = Uuid::new_v4();
    let stored_filename = format!("{}_{}", file_id, filename);
    let upload_dir = "uploads";
    
    fs::create_dir_all(upload_dir).await?;
    let file_path = Path::new(upload_dir).join(&stored_filename);
    fs::write(&file_path, &data).await?;

    let blob_url = format!("/api/files/download/{}", file_id);

    println!("Attempting to insert file with ID: {}", file_id);
    println!("Target type: {}, Target ID: {}, Uploaded by: {}", target_type, target_id, uploaded_by);
    
    let attached_file = sqlx::query_as::<_, AttachedFile>(
        "INSERT INTO attached_files (file_id, target_type, target_id, original_filename, stored_filename, file_size, content_type, blob_url, uploaded_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING file_id, target_type, target_id, original_filename, stored_filename, file_size, content_type, blob_url, uploaded_by, created_at"
    )
    .bind(file_id)
    .bind(target_type)
    .bind(target_id)
    .bind(&filename)
    .bind(&stored_filename)
    .bind(file_size)
    .bind(&content_type)
    .bind(&blob_url)
    .bind(uploaded_by)
    .bind(Utc::now())
    .fetch_one(pool)
    .await
    .map_err(|e| {
        println!("Database INSERT error: {:?}", e);
        e
    })?;
    
    println!("Successfully inserted file with ID: {}", attached_file.file_id);

    Ok(attached_file)
}
