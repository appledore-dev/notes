use axum::{
    Json,
    Extension, http::StatusCode,
    extract::Path,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{PgPool, query};
use uuid::Uuid;

use crate::auth::CurrentUser;

pub async fn get_handler(
    Path(doc_id): Path<String>,
    Extension(pool): Extension<PgPool>,
    Extension(auth_user): Extension<CurrentUser>
) -> (StatusCode, Json<DocResponse>) {
    let docs = query!(
        r#"
        SELECT * FROM docs WHERE user_id = $1 AND id = $2
        "#,
        Uuid::parse_str(&auth_user.id).unwrap(),
        Uuid::parse_str(&doc_id).unwrap()
    )
    .fetch_one(&pool);

    match docs.await {
        Ok(doc) => {
            let doc = Doc {
                id: doc.id.to_string(),
                user_id: doc.user_id.to_string(),
                title: doc.title,
                content_text: doc.content_text,
                content_json: doc.content_json,
                content_html: doc.content_html,
                created_at: doc.created_at.expect("Failed to parse created_at").to_string(),
                updated_at: doc.updated_at.expect("Failed to parse updated_at").to_string(),
            };
            return (StatusCode::OK, Json(DocResponse { doc: Some(doc), error: None }));
        }
        Err(_) => {
            return (StatusCode::NOT_FOUND, Json(DocResponse { doc: None, error: Some("Document not found".to_string()) }));
        }
    }
}

pub async fn put_handler(
    Path(doc_id): Path<String>,
    Extension(pool): Extension<PgPool>,
    Extension(auth_user): Extension<CurrentUser>,
    Json(payload): Json<DocRequest>
) -> (StatusCode, Json<DocResponse>) {
    let doc = query!(
        r#"
        UPDATE docs SET title = $1, content_text = $2, content_json = $3, content_html = $4 WHERE id = $5 AND user_id = $6
        RETURNING id, user_id, title, content_text, content_json, content_html, created_at, updated_at
        "#,
        payload.title,
        payload.content_text,
        payload.content_json,
        payload.content_html,
        Uuid::parse_str(&doc_id).unwrap(),
        Uuid::parse_str(&auth_user.id).unwrap()
    )
    .fetch_one(&pool);

    match doc.await {
        Ok(doc) => {
            let doc = Doc {
                id: doc.id.to_string(),
                user_id: doc.user_id.to_string(),
                title: doc.title,
                content_text: doc.content_text,
                content_json: doc.content_json,
                content_html: doc.content_html,
                created_at: doc.created_at.expect("Failed to parse created_at").to_string(),
                updated_at: doc.updated_at.expect("Failed to parse updated_at").to_string(),
            };
            return (StatusCode::OK, Json(DocResponse { doc: Some(doc), error: None }));
        }
        Err(_) => {
            return (StatusCode::NOT_FOUND, Json(DocResponse { doc: None, error: Some("Document not found".to_string()) }));
        }
    }
}

pub async fn delete_handler(
    Path(doc_id): Path<String>,
    Extension(pool): Extension<PgPool>,
    Extension(auth_user): Extension<CurrentUser>
) -> (StatusCode, Json<DocResponse>) {
    let doc = query!(
        r#"
        DELETE FROM docs WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, title, content_text, content_json, content_html, created_at, updated_at
        "#,
        Uuid::parse_str(&doc_id).unwrap(),
        Uuid::parse_str(&auth_user.id).unwrap()
    )
    .fetch_one(&pool);

    match doc.await {
        Ok(doc) => {
            let doc = Doc {
                id: doc.id.to_string(),
                user_id: doc.user_id.to_string(),
                title: doc.title,
                content_text: doc.content_text,
                content_json: doc.content_json,
                content_html: doc.content_html,
                created_at: doc.created_at.expect("Failed to parse created_at").to_string(),
                updated_at: doc.updated_at.expect("Failed to parse updated_at").to_string(),
            };
            return (StatusCode::OK, Json(DocResponse { doc: Some(doc), error: None }));
        }
        Err(_) => {
            return (StatusCode::NOT_FOUND, Json(DocResponse { doc: None, error: Some("Document not found".to_string()) }));
        }
    }
}

#[derive(Deserialize)]
pub struct DocRequest {
    title: String,
    content_text: String,
    content_json: Value,
    content_html: String,
}

#[derive(Serialize)]
pub struct DocResponse {
    doc: Option<Doc>,
    error: Option<String>,
}

#[derive(Serialize)]
pub struct Doc {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub content_text: String,
    pub content_json: Value,
    pub content_html: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct CreateDoc {
    pub user_id: String,
    pub title: String,
    pub content_text: String,
    pub content_json: Value,
    pub content_html: String,
}
