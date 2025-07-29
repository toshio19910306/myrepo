use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde_json::json;
use validator::Validate;

use crate::{
    models::{CreateSpecificationRequest, SpecificationResponse, UpdateSpecificationRequest},
    services::specification_service,
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
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    let page = 1;
    let per_page = 20;
    match specification_service::get_all_specifications(&state.db_pool, page, per_page).await {
        Ok(specifications) => {
            let spec_data: Vec<serde_json::Value> = specifications
                .into_iter()
                .map(|s| {
                    let spec_response = SpecificationResponse::from(s);
                    serde_json::json!({
                        "spec_id": spec_response.spec_id,
                        "spec_number": spec_response.spec_number,
                        "title": spec_response.title,
                        "work_items": spec_response.work_items,
                        "deliverables": spec_response.deliverables,
                        "desired_delivery_date": spec_response.desired_delivery_date,
                        "delivery_location": spec_response.delivery_location,
                        "acceptance_conditions": spec_response.acceptance_conditions,
                        "estimate_copies": spec_response.estimate_copies,
                        "supplied_items": spec_response.supplied_items,
                        "loaned_items": spec_response.loaned_items,
                        "applicable_standards": spec_response.applicable_standards,
                        "special_notes": spec_response.special_notes,
                        "status": spec_response.status,
                        "created_by": spec_response.created_by,
                        "created_at": spec_response.created_at,
                        "updated_at": spec_response.updated_at
                    })
                })
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(spec_data),
                message: "仕様書一覧を取得しました".to_string(),
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

async fn get_specification(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match specification_service::get_specification_by_id(&state.db_pool, id).await {
        Ok(Some(specification)) => {
            let spec_response = SpecificationResponse::from(specification);
            Ok(Json(ApiResponse {
                success: true,
                data: Some(serde_json::json!({
                    "spec_id": spec_response.spec_id,
                    "spec_number": spec_response.spec_number,
                    "title": spec_response.title,
                    "work_items": spec_response.work_items,
                    "deliverables": spec_response.deliverables,
                    "desired_delivery_date": spec_response.desired_delivery_date,
                    "delivery_location": spec_response.delivery_location,
                    "acceptance_conditions": spec_response.acceptance_conditions,
                    "estimate_copies": spec_response.estimate_copies,
                    "supplied_items": spec_response.supplied_items,
                    "loaned_items": spec_response.loaned_items,
                    "applicable_standards": spec_response.applicable_standards,
                    "special_notes": spec_response.special_notes,
                    "status": spec_response.status,
                    "created_by": spec_response.created_by,
                    "created_at": spec_response.created_at,
                    "updated_at": spec_response.updated_at
                })),
                message: "仕様書を取得しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        },
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "SPECIFICATION_NOT_FOUND",
                    "message": "仕様書が見つかりません"
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

async fn create_specification(
    State(state): State<AppState>,
    Json(payload): Json<CreateSpecificationRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    if let Err(errors) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "VALIDATION_ERROR",
                    "message": "入力値に誤りがあります",
                    "details": errors
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        ));
    }

    match specification_service::create_specification(&state.db_pool, payload).await {
        Ok(specification) => {
            let spec_response = SpecificationResponse::from(specification);
            Ok(Json(ApiResponse {
                success: true,
                data: Some(serde_json::json!({
                    "spec_id": spec_response.spec_id,
                    "spec_number": spec_response.spec_number,
                    "title": spec_response.title,
                    "work_items": spec_response.work_items,
                    "deliverables": spec_response.deliverables,
                    "desired_delivery_date": spec_response.desired_delivery_date,
                    "delivery_location": spec_response.delivery_location,
                    "acceptance_conditions": spec_response.acceptance_conditions,
                    "estimate_copies": spec_response.estimate_copies,
                    "supplied_items": spec_response.supplied_items,
                    "loaned_items": spec_response.loaned_items,
                    "applicable_standards": spec_response.applicable_standards,
                    "special_notes": spec_response.special_notes,
                    "status": spec_response.status,
                    "created_by": spec_response.created_by,
                    "created_at": spec_response.created_at,
                    "updated_at": spec_response.updated_at
                })),
                message: "仕様書を作成しました".to_string(),
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

async fn update_specification(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateSpecificationRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    if let Err(errors) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "VALIDATION_ERROR",
                    "message": "入力値に誤りがあります",
                    "details": errors
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        ));
    }

    match specification_service::update_specification(&state.db_pool, id, payload).await {
        Ok(Some(specification)) => {
            let spec_response = SpecificationResponse::from(specification);
            Ok(Json(ApiResponse {
                success: true,
                data: Some(serde_json::json!({
                    "spec_id": spec_response.spec_id,
                    "spec_number": spec_response.spec_number,
                    "title": spec_response.title,
                    "work_items": spec_response.work_items,
                    "deliverables": spec_response.deliverables,
                    "desired_delivery_date": spec_response.desired_delivery_date,
                    "delivery_location": spec_response.delivery_location,
                    "acceptance_conditions": spec_response.acceptance_conditions,
                    "estimate_copies": spec_response.estimate_copies,
                    "supplied_items": spec_response.supplied_items,
                    "loaned_items": spec_response.loaned_items,
                    "applicable_standards": spec_response.applicable_standards,
                    "special_notes": spec_response.special_notes,
                    "status": spec_response.status,
                    "created_by": spec_response.created_by,
                    "created_at": spec_response.created_at,
                    "updated_at": spec_response.updated_at
                })),
                message: "仕様書を更新しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        },
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "SPECIFICATION_NOT_FOUND",
                    "message": "仕様書が見つかりません"
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

async fn delete_specification(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match specification_service::delete_specification(&state.db_pool, id).await {
        Ok(true) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({})),
            message: "仕様書を削除しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(false) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "SPECIFICATION_NOT_FOUND",
                    "message": "仕様書が見つかりません"
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
        Err(e) => {
            let error_message = e.to_string();
            if error_message.contains("見積依頼で使用されているため削除できません") || 
               error_message.contains("関連する見積依頼を先に削除してください") {
                Err((
                    StatusCode::BAD_REQUEST,
                    Json(ErrorResponse {
                        success: false,
                        error: json!({
                            "code": "DELETE_CONSTRAINT_VIOLATION",
                            "message": error_message
                        }),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    }),
                ))
            } else {
                Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        success: false,
                        error: json!({
                            "code": "INTERNAL_ERROR",
                            "message": error_message
                        }),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    }),
                ))
            }
        },
    }
}

async fn submit_specification(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ErrorResponse>)> {
    match specification_service::submit_specification(&state.db_pool, id).await {
        Ok(Some(_)) => Ok(Json(ApiResponse {
            success: true,
            data: Some(json!({})),
            message: "仕様書を提出しました".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                success: false,
                error: json!({
                    "code": "SPECIFICATION_NOT_FOUND",
                    "message": "仕様書が見つかりません"
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

async fn get_work_items(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match specification_service::get_work_items().await {
        Ok(work_items) => {
            let items_data: Vec<serde_json::Value> = work_items
                .into_iter()
                .map(|w| w)
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(items_data),
                message: "作業項目マスターを取得しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: serde_json::json!({
                    "code": "INTERNAL_ERROR",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}

async fn get_deliverables(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, (StatusCode, Json<ErrorResponse>)> {
    match specification_service::get_deliverables().await {
        Ok(deliverables) => {
            let deliverables_data: Vec<serde_json::Value> = deliverables
                .into_iter()
                .map(|d| d)
                .collect();

            Ok(Json(ApiResponse {
                success: true,
                data: Some(deliverables_data),
                message: "成果物マスターを取得しました".to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: serde_json::json!({
                    "code": "INTERNAL_ERROR",
                    "message": e.to_string()
                }),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }),
        )),
    }
}
