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
use chrono::{ Duration, Utc };
use jsonwebtoken::{
    encode,
    EncodingKey,
    Header,
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
                return (StatusCode::BAD_REQUEST, Json(
                    OtpVerifyResponse { access_token: None }
                ));
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
                    let token = encode_jwt(user.email)
                        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR).unwrap();
                    return (StatusCode::OK, Json(
                        OtpVerifyResponse { access_token: Some(token) }
                    ));
                }
                Err(_) => {
                    return (StatusCode::BAD_REQUEST, Json(
                        OtpVerifyResponse { access_token: None }
                    ));
                }
            }
        }
        Err(_) => {
            return (StatusCode::BAD_REQUEST, Json(
                OtpVerifyResponse { access_token: None }
            ));
        }
    }
}

pub fn encode_jwt(email: String) -> Result<String, StatusCode> {
    let secret: String = std::env::var("SECRET").expect("SECRET must be set").as_str().to_string();
    let now = Utc::now();
    let expire: chrono::TimeDelta = Duration::hours(120);
    let exp: usize = (now + expire).timestamp() as usize;
    let iat: usize = now.timestamp() as usize;
    let claim = Claims { iat, exp, email };

    encode(
        &Header::default(),
        &claim,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Deserialize)]
pub struct OtpVerifyRequest {
    email: String,
    verification_code: String,
}

#[derive(Serialize)]
pub struct OtpVerifyResponse {
    access_token: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Claims {
    pub exp: usize,
    pub iat: usize,
    pub email: String,
}
