use axum::{
    Json,
    Extension, http::StatusCode,
};
use serde::{Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::auth::CurrentUser;

pub async fn handler(Extension(auth_user): Extension<CurrentUser>) -> (StatusCode, Json<MeResponse>) {
    (StatusCode::OK, Json(MeResponse {
        user: User {
            id: auth_user.id.to_string(),
            email: auth_user.email.clone(),
        }
    }))
}

#[derive(Serialize)]
pub struct MeResponse {
    user: User
}

#[derive(Serialize)]
struct User {
    id: String,
    email: String,
}
