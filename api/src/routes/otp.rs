use argon2::{
    Argon2,
    PasswordHasher,
    password_hash::{
        Salt,
        SaltString,
        rand_core::OsRng,
    },
};
use axum::{
    Json,
    Extension, http::StatusCode,
};
use lettre::{Message, SmtpTransport, Transport};
use lettre::transport::smtp::{authentication::{Credentials}};
use lettre::message::{MultiPart, SinglePart};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::env::var;
use sqlx::{PgPool, query};

pub async fn handler(Extension(pool): Extension<PgPool>, Json(payload): Json<OtpRequest>) -> (StatusCode, Json<OtpResponse>) {
    let user = query!(
        r#"
        SELECT * FROM users WHERE email = $1
        "#,
        payload.email
    )
    .fetch_one(&pool);

    let password = rand::rng().random_range(100000..=999999).to_string();
    println!("Generated password: {}", password);

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
            .await
            .expect("Failed to update user");
            send_otp_email(&payload.email, &password).await;
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
            .await
            .expect("Failed to insert user");

            return (StatusCode::OK, Json(OtpResponse {}));
        }
    }
}

async fn send_otp_email(to: &str, otp: &str) {
    let email = Message::builder()
        .from(
            var("EMAIL_FROM").expect("EMAIL_FROM must be set").as_str()
            .parse().unwrap()
        )
        .to(to.parse().unwrap())
        .subject(format!("Your OTP Code: {}", otp))
        .multipart(
            MultiPart::alternative()
                .singlepart(
                    SinglePart::html(format!("<h3>Hello! 👋</h3><p>Your OTP code for <strong>Notes - Helpedby AI</strong> is: {}</p>", otp))
                )
        )
        .unwrap();

    let creds = Credentials::new(
        var("EMAIL_USER").expect("EMAIL_USER must be set").as_str().to_string(),
        var("EMAIL_PASS").expect("EMAIL_PASS must be set").as_str().to_string()
    );

    let mailer = SmtpTransport::starttls_relay(
        &var("EMAIL_HOST").expect("EMAIL_HOST must be set").as_str().to_string())
        .unwrap()
        .credentials(creds)
        .build();

    match mailer.send(&email) {
        Ok(_) => println!("Email sent successfully!"),
        Err(e) => eprintln!("Could not send email: {:?}", e),
    }
}

#[derive(Deserialize)]
pub struct OtpRequest {
    email: String,
}

#[derive(Serialize)]
pub struct OtpResponse {}
