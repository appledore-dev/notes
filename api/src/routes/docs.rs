use axum::{
    Json,
    Extension, http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{PgPool, query};
use uuid::Uuid;

pub async fn get_handler(Extension(pool): Extension<PgPool>) -> (StatusCode, Json<DocsResponse>) {
    let docs = query!(
        r#"
        SELECT * FROM docs
        "#,
    )
    .fetch_all(&pool)
    .await
    .expect("Failed to fetch docs");

    let docs: Vec<Doc> = docs.into_iter().map(|doc| Doc {
        id: doc.id.to_string(),
        user_id: doc.user_id.to_string(),
        title: doc.title,
        content_text: doc.content_text,
        content_json: doc.content_json,
        created_at: doc.created_at.expect("Failed to parse created_at").to_string(),
        updated_at: doc.updated_at.expect("Failed to parse updated_at").to_string(),
    }).collect();

    (StatusCode::OK, Json(DocsResponse { docs, error: None }))
}

pub async fn post_handler(Extension(pool): Extension<PgPool>, Json(payload): Json<DocsRequest>) -> (StatusCode, Json<DocsResponse>) {
    let data = CreateDoc {
        title: payload.title,
        content_text: payload.content_text,
        content_json: payload.content_json,
        user_id: "user_id".to_string(), // Placeholder, replace with actual user ID
    };

    let doc = query!(
        r#"
        INSERT INTO docs (user_id, title, content_text, content_json)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, title, content_text, content_json, created_at, updated_at
        "#,
        Uuid::parse_str(&data.user_id).unwrap(),
        data.title,
        data.content_text,
        data.content_json,
    )
    .fetch_one(&pool)
    .await
    .expect("Failed to create doc");

    let result: Doc = Doc {
        id: doc.id.to_string(),
        user_id: doc.user_id.to_string(),
        title: doc.title,
        content_text: doc.content_text,
        content_json: doc.content_json,
        created_at: doc.created_at.expect("Failed to parse created_at").to_string(),
        updated_at: doc.updated_at.expect("Failed to parse updated_at").to_string(),
    };

    (StatusCode::OK, Json(DocsResponse { docs: vec![result], error: None }))
}

#[derive(Deserialize)]
pub struct DocsRequest {
    title: String,
    content_text: String,
    content_json: Value,
}

#[derive(Serialize)]
pub struct DocsResponse {
    docs: Vec<Doc>,
    error: Option<String>,
}

#[derive(Serialize)]
pub struct Doc {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub content_text: String,
    pub content_json: Value,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct CreateDoc {
    pub user_id: String,
    pub title: String,
    pub content_text: String,
    pub content_json: Value,
}
