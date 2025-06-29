use axum::{
    extract::{Multipart, Path, Query, State},
    http::{header, StatusCode},
    response::{Json, Response},
    routing::{delete, get, post},
    Router,
};
use serde::Deserialize;
use serde_json::json;
use tokio::fs;
use uuid::Uuid;

use crate::services::file_service;
use crate::utils::response::{ApiResponse, ErrorResponse};
use crate::AppState;

#[derive(Deserialize)]
struct UploadQuery {
    target_type: String,
    target_id: i32,
    uploaded_by: i32,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_all_files))
        .route("/upload", post(upload_file_multipart))
        .route("/:id", delete(delete_file))
        .route("/download/:id", get(download_file))
        .route("/target/:target_type/:target_id", get(get_files_by_target))
}

async fn upload_file_multipart(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    let mut target_type = "SPECIFICATION".to_string(); // Default to SPECIFICATION
    let mut target_id = 1i32; // Default target ID
    let uploaded_by = 1i32; // Default user for now
    
    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("").to_string();
        
        if name == "target_type" {
            target_type = field.text().await.unwrap_or_default();
        } else if name == "target_id" {
            target_id = field.text().await.unwrap_or_default().parse().unwrap_or(1);
        } else if name == "file" {
            match file_service::upload_file_from_field(
                &state.db_pool,
                field,
                &target_type,
                target_id,
                uploaded_by,
            ).await {
                Ok(response) => return Ok(Json(ApiResponse {
                    success: true,
                    data: Some(json!({
                        "file_id": response.file_id,
                        "filename": response.original_filename,
                        "size": response.file_size,
                        "content_type": response.content_type,
                        "url": response.blob_url
                    })),
                    message: "ファイルをアップロードしました".to_string(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                })),
                Err(e) => return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ErrorResponse {
                        success: false,
                        error: json!({
                            "code": "UPLOAD_ERROR",
                            "message": e.to_string()
                        }),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    }),
                )),
            }
        }
    }
    
    Err((
        StatusCode::BAD_REQUEST,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "MISSING_FILE",
                "message": "No file provided"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn download_file(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Response, (StatusCode, Json<ErrorResponse>)> {
    match file_service::get_file_by_id(&state.db_pool, id).await {
        Ok(Some(file)) => {
            let file_path = std::path::Path::new("uploads").join(&file.stored_filename);
            match fs::read(&file_path).await {
                Ok(contents) => {
                    let response = Response::builder()
                        .status(StatusCode::OK)
                        .header(header::CONTENT_TYPE, file.content_type)
                        .header(
                            header::CONTENT_DISPOSITION,
                            format!("attachment; filename=\"{}\"", file.original_filename),
                        )
                        .body(contents.into())
                        .unwrap();
                    Ok(response)
                }
                Err(_) => Err((
                    StatusCode::NOT_FOUND,
                    Json(ErrorResponse {
                        success: false,
                        error: json!({
                            "code": "FILE_NOT_FOUND",
                            "message": "ファイルが見つかりません"
                        }),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    }),
                )),
            }
        }
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "FILE_NOT_FOUND",
                    "message": "ファイルが見つかりません"
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "INTERNAL_ERROR",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn delete_file(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match file_service::delete_file(&state.db_pool, id).await {
        Ok(true) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({})),
            message: "ファイルを削除しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(false) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "FILE_NOT_FOUND",
                    "message": "ファイルが見つかりません"
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "INTERNAL_ERROR",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn get_all_files(
    State(state): State<AppState>,
) -> Result<Json<Vec<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match file_service::get_all_files(&state.db_pool).await {
        Ok(files) => {
            let file_data: Vec<serde_json::Value> = files
                .into_iter()
                .map(|f| json!({
                    "file_id": f.file_id,
                    "original_filename": f.original_filename,
                    "file_size": f.file_size,
                    "content_type": f.content_type,
                    "created_at": f.created_at,
                    "blob_url": f.blob_url,
                    "target_type": f.target_type,
                    "target_id": f.target_id
                }))
                .collect();

            Ok(Json(file_data))
        }
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "INTERNAL_ERROR",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn get_files_by_target(
    State(state): State<AppState>,
    Path((target_type, target_id)): Path<(String, i32)>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match file_service::get_files_by_target(&state.db_pool, &target_type, target_id).await {
        Ok(files) => {
            let file_data: Vec<serde_json::Value> = files
                .into_iter()
                .map(|f| json!({
                    "file_id": f.file_id,
                    "filename": f.original_filename,
                    "size": f.file_size,
                    "content_type": f.content_type,
                    "url": f.blob_url,
                    "uploaded_at": f.created_at
                }))
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(file_data),
                message: "ファイル一覧を取得しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "INTERNAL_ERROR",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}
