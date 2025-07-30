use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde_json::json;

use crate::{
    services::company_service,
    utils::response::{ApiResponse, ErrorResponse},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_companies).post(create_company))
        .route("/:id", get(get_company_by_id).put(update_company).delete(delete_company))
}

async fn get_companies(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match company_service::get_all_companies(&state.db_pool).await {
        Ok(companies) => {
            let company_data: Vec<serde_json::Value> = companies
                .into_iter()
                .map(|c| serde_json::json!({
                    "company_id": c.company_id,
                    "company_name": c.company_name,
                    "is_active": c.is_active,
                    "created_at": c.created_at,
                    "updated_at": c.updated_at
                }))
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(company_data),
                message: "会社一覧を取得しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        },
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

async fn get_company_by_id(
    State(state): State<AppState>,
    Path(company_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match company_service::get_company_by_id(&state.db_pool, company_id).await {
        Ok(Some(company)) => {
            let company_data = json!({
                "company_id": company.company_id,
                "company_name": company.company_name,
                "is_active": company.is_active,
                "created_at": company.created_at,
                "updated_at": company.updated_at
            });
            Ok(Json(ApiResponse {
                success: true,
                data: Some(company_data),
                message: "会社詳細を取得しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        },
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "COMPANY_NOT_FOUND", "message": "会社が見つかりません"}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "INTERNAL_ERROR", "message": e.to_string()}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn create_company(
    State(state): State<AppState>,
    Json(request): Json<crate::models::company::CreateCompanyRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match company_service::create_company(&state.db_pool, request).await {
        Ok(company) => {
            let company_data = serde_json::json!({
                "company_id": company.company_id,
                "company_name": company.company_name,
                "is_active": company.is_active,
                "created_at": company.created_at,
                "updated_at": company.updated_at
            });

            Ok(Json(ApiResponse {
                success: true,
                data: Some(company_data),
                message: "会社が正常に作成されました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        },
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "COMPANY_CREATION_FAILED",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn update_company(
    State(state): State<AppState>,
    Path(company_id): Path<i32>,
    Json(request): Json<crate::models::company::UpdateCompanyRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match company_service::update_company(&state.db_pool, company_id, request).await {
        Ok(Some(company)) => {
            let company_data = json!({
                "company_id": company.company_id,
                "company_name": company.company_name,
                "is_active": company.is_active,
                "created_at": company.created_at,
                "updated_at": company.updated_at
            });
            Ok(Json(ApiResponse {
                success: true,
                data: Some(company_data),
                message: "会社情報を更新しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        },
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "COMPANY_NOT_FOUND", "message": "会社が見つかりません"}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "INTERNAL_ERROR", "message": e.to_string()}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn delete_company(
    State(state): State<AppState>,
    Path(company_id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match company_service::delete_company(&state.db_pool, company_id).await {
        Ok(true) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({"company_id": company_id})),
            message: "会社を削除しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(false) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "COMPANY_NOT_FOUND", "message": "会社が見つかりません"}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: json!({"code": "INTERNAL_ERROR", "message": e.to_string()}),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}
