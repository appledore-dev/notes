use argon2::{
    Argon2,
    PasswordHasher,
    PasswordVerifier,
    password_hash::Salt,
    password_hash::SaltString,
    password_hash::rand_core::OsRng,
};
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

    let password = rand::thread_rng().gen_range(100000..=999999).to_string();
    let salt_str = SaltString::generate(&mut OsRng);
    let salt: Salt = salt_str.as_str().try_into().unwrap();
    let argon2 = Argon2::default();
    let hash = argon2.hash_password(password.as_bytes(), salt).unwrap();

    match user.await {
        Ok(user) => {
            query!(
                r#"
                UPDATE users SET verification_code = $1 WHERE id = $2
                RETURNING id, email, verification_code, created_at
                "#,
                hash.to_string(),
                user.id
            )
            .fetch_one(&pool)
            .await;
            return (StatusCode::OK, Json(OtpResponse {}));
        }
        Err(_) => {
            query!(
                r#"
                INSERT INTO users (email, verification_code) VALUES ($1, $2)
                RETURNING id, email, verification_code, created_at
                "#,
                payload.email,
                hash.to_string(),
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
