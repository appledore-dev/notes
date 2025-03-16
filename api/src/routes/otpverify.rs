use argon2::{
    Argon2,
    password_hash::{
        PasswordHash,
    },
};
use axum::{
    Json,
    Extension, http::StatusCode,
};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, query};

pub async fn handler(Extension(pool): Extension<PgPool>, Json(payload): Json<OtpVerifyRequest>) -> (StatusCode, Json<OtpVerifyResponse>) {
    let user = query!(
        r#"
        SELECT * FROM users WHERE email = $1
        "#,
        payload.email
    )
    .fetch_one(&pool);

    match user.await {
        Ok(user) => {
            if payload.verification_code.is_empty() {
                return (StatusCode::BAD_REQUEST, Json(OtpVerifyResponse {}));
            }

            let code = user.verification_code.clone().unwrap_or_default();
            let password_hash = PasswordHash::new(&code).expect("invalid password hash");
            let res = password_hash.verify_password(&[&Argon2::default()], payload.verification_code.as_str());
            match res {
                Ok(_) => {
                    query!(
                        r#"
                        UPDATE users SET verification_code = $1 WHERE email = $2
                        RETURNING id, email, verification_code, created_at
                        "#,
                        None::<String>,
                        payload.email
                    )
                    .fetch_one(&pool)
                    .await
                    .expect("Failed to update user");
                    return (StatusCode::OK, Json(OtpVerifyResponse {}));
                }
                Err(_) => {
                    return (StatusCode::BAD_REQUEST, Json(OtpVerifyResponse {}));
                }
            }
        }
        Err(_) => {
            return (StatusCode::BAD_REQUEST, Json(OtpVerifyResponse {}));
        }
    }
}

#[derive(Deserialize)]
pub struct OtpVerifyRequest {
    email: String,
    verification_code: String,
}

#[derive(Serialize)]
pub struct OtpVerifyResponse {}
