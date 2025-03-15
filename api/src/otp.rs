use axum::{
    Json,
    Extension, http::StatusCode,
};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, query};

pub async fn handler(Extension(pool): Extension<PgPool>, Json(payload): Json<OtpRequest>) -> (StatusCode, Json<OtpResponse>) {
    let user = query!(
        r#"
        SELECT * FROM users WHERE email = $1
        "#,
        payload.email
    )
    .fetch_one(&pool);

    match user.await {
        Ok(user) => {
            let random_number = rand::thread_rng().gen_range(100000..=999999).to_string();
            let user = query!(
                r#"
                UPDATE users SET verification_code = $1 WHERE id = $2
                RETURNING id, email, verification_code, created_at
                "#,
                random_number,
                user.id
            )
            .fetch_one(&pool)
            .await;
            return (StatusCode::OK, Json(OtpResponse {}));
        }
        Err(_) => {
            let random_number = rand::thread_rng().gen_range(100000..=999999).to_string();
            let user = query!(
                r#"
                INSERT INTO users (email, verification_code) VALUES ($1, $2)
                RETURNING id, email, verification_code, created_at
                "#,
                payload.email,
                random_number,
            )
            .fetch_one(&pool)
            .await;
            return (StatusCode::OK, Json(OtpResponse {}));
        }
    }
}

#[derive(Deserialize)]
pub struct OtpRequest {
    email: String,
}

#[derive(Serialize)]
pub struct OtpResponse {}
