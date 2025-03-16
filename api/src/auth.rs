use axum::{
    body::Body,
    response::IntoResponse,
    extract::{ Request, Json },
    http,
    http::{ Response, StatusCode },
    middleware::Next,
};
use bcrypt::{ hash, verify, DEFAULT_COST };
use chrono::{ Duration, Utc };
use jsonwebtoken::{
    decode,
    encode,
    DecodingKey,
    EncodingKey,
    Header,
    TokenData,
    Validation
};
use serde::{ Deserialize, Serialize };
use serde_json::json;

#[derive(Serialize, Deserialize)]
pub struct Claims {
    pub exp: usize,
    pub iat: usize,
    pub email: String,
}

#[derive(Deserialize)]
pub struct SignInData {
    pub email: String,
    pub password: String,
}
