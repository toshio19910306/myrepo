use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde_json::json;

use crate::{
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_specifications).post(create_specification))
        .route("/:id", get(get_specification).put(update_specification).delete(delete_specification))
        .route("/:id/submit", post(submit_specification))
        .route("/work-items", get(get_work_items))
        .route("/deliverables", get(get_deliverables))
}

async fn get_specifications(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "仕様書管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn get_specification(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "仕様書管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn create_specification(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "仕様書管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn update_specification(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "仕様書管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn delete_specification(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "仕様書管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn submit_specification(
    State(_state): State<AppState>,
    Path(_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            success: false,
            error: json!({
                "code": "NOT_IMPLEMENTED",
                "message": "仕様書管理機能は未実装です"
            }),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
    ))
}

async fn get_work_items(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<String>>>, (StatusCode, Json<ErrorResponse>)> {
    let work_items = vec![
        "要件定義".to_string(),
        "基本設計".to_string(),
        "詳細設計".to_string(),
        "プログラミング".to_string(),
        "単体テスト".to_string(),
        "結合テスト".to_string(),
        "システムテスト".to_string(),
        "運用テスト".to_string(),
    ];

    Ok(Json(ApiResponse {
        success: true,
        data: Some(work_items),
        message: "作業項目マスターを取得しました".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn get_deliverables(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<String>>>, (StatusCode, Json<ErrorResponse>)> {
    let deliverables = vec![
        "要件定義書".to_string(),
        "基本設計書".to_string(),
        "詳細設計書".to_string(),
        "プログラム".to_string(),
        "テスト仕様書".to_string(),
        "テスト結果報告書".to_string(),
        "運用手順書".to_string(),
        "保守手順書".to_string(),
    ];

    Ok(Json(ApiResponse {
        success: true,
        data: Some(deliverables),
        message: "成果物マスターを取得しました".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}
