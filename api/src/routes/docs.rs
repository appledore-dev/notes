use axum::{
    Json,
    Extension, http::StatusCode,
    extract::Query,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{PgPool, query};
use uuid::Uuid;

use crate::auth::CurrentUser;

pub async fn get_handler(Extension(pool): Extension<PgPool>, Extension(auth_user): Extension<CurrentUser>, Query(params): Query<Params>) -> (StatusCode, Json<DocsResponse>) {
    let search = params.search.unwrap_or_default();
    if search.is_empty() {
        let docs = query!(
            r#"
            SELECT id, title FROM docs WHERE user_id = $1 ORDER BY created_at DESC
            "#,
            Uuid::parse_str(&auth_user.id).unwrap()
        )
            .fetch_all(&pool)
            .await
            .expect("Failed to fetch docs");

        let docs: Vec<Doc> = docs.into_iter().map(|doc| Doc {
            id: doc.id.to_string(),
            title: doc.title,
            user_id: None,
            content_text: None,
            content_json: None,
            content_html: None,
            created_at: None,
            updated_at: None,
        }).collect();

        (StatusCode::OK, Json(DocsResponse { docs, error: None }))
    } else {
        let docs = query!(
            r#"
            SELECT id, title, content_text FROM docs WHERE user_id = $1 AND (content_text @@ to_tsquery($2) OR title @@ to_tsquery($2)) ORDER BY created_at DESC
            "#,
            Uuid::parse_str(&auth_user.id).unwrap(),
            search
        )
            .fetch_all(&pool)
            .await
            .expect("Failed to fetch docs");

        let docs: Vec<Doc> = docs.into_iter().map(|doc| Doc {
            id: doc.id.to_string(),
            title: doc.title,
            user_id: None,
            content_text: Some(doc.content_text),
            content_json: None,
            content_html: None,
            created_at: None,
            updated_at: None,
        }).collect();

        (StatusCode::OK, Json(DocsResponse { docs, error: None }))
    }
}

pub async fn post_handler(
    Extension(pool): Extension<PgPool>,
    Extension(auth_user): Extension<CurrentUser>,
    Json(payload): Json<DocsRequest>
) -> (StatusCode, Json<DocResponse>) {
    let data = CreateDoc {
        title: payload.title,
        content_text: payload.content_text,
        content_json: payload.content_json,
        content_html: payload.content_html,
        user_id: auth_user.id.to_string()
    };

    let doc = query!(
        r#"
        INSERT INTO docs (user_id, title, content_text, content_json, content_html)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, title, content_text, content_json, content_html, created_at, updated_at
        "#,
        Uuid::parse_str(&data.user_id).unwrap(),
        data.title,
        data.content_text,
        data.content_json,
        data.content_html,
    )
    .fetch_one(&pool)
    .await
    .expect("Failed to create doc");

    let result: Doc = Doc {
        id: doc.id.to_string(),
        title: doc.title,
        user_id: Some(doc.user_id.to_string()),
        content_text: Some(doc.content_text),
        content_json: Some(doc.content_json),
        content_html: Some(doc.content_html),
        created_at: Some(doc.created_at.expect("Failed to parse created_at").to_string()),
        updated_at: Some(doc.updated_at.expect("Failed to parse updated_at").to_string()),
    };

    (StatusCode::OK, Json(DocResponse { doc: Some(result), error: None }))
}

#[derive(Deserialize)]
pub struct Params {
    pub search: Option<String>,
}

#[derive(Deserialize)]
pub struct DocsRequest {
    title: String,
    content_text: String,
    content_json: Value,
    content_html: String,
}

#[derive(Serialize)]
pub struct DocsResponse {
    docs: Vec<Doc>,
    error: Option<String>,
}

#[derive(Serialize)]
pub struct DocResponse {
    doc: Option<Doc>,
    error: Option<String>,
}

#[derive(Serialize)]
pub struct Doc {
    pub id: String,
    pub title: String,
    pub user_id: Option<String>,
    pub content_text: Option<String>,
    pub content_json: Option<Value>,
    pub content_html: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Serialize)]
pub struct CreateDoc {
    pub user_id: String,
    pub title: String,
    pub content_text: String,
    pub content_json: Value,
    pub content_html: String,
}
