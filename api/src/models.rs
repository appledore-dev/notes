use serde::Serialize;
use serde_json::Value;

#[derive(Serialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub verification_code: Option<String>,
    pub created_at: String,
}

#[derive(Serialize)]
pub struct CreateUser {
    pub email: String,
    pub verification_code: Option<String>,
}

#[derive(Serialize)]
pub struct UpdateUser {
    pub email: Option<String>,
    pub verification_code: Option<String>,
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

#[derive(Serialize)]
pub struct UpdateDoc {
    pub user_id: String,
    pub title: Option<String>,
    pub content_text: Option<String>,
    pub content_json: Option<Value>,
}
