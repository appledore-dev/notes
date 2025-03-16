use axum::{
    body::Body,
    response::IntoResponse,
    extract::{ Request, Json },
    http,
    http::{ Response, StatusCode },
    middleware::Next,
};
use jsonwebtoken::{
    decode,
    DecodingKey,
    TokenData,
    Validation
};
use serde::{ Deserialize, Serialize };
use serde_json::json;
use sqlx::{PgPool, query};

#[derive(Serialize, Deserialize)]
pub struct Claims {
    pub exp: usize,
    pub iat: usize,
    pub email: String,
}

pub struct AuthError {
    pub message: String,
    pub status_code: StatusCode,
}

#[derive(Clone)]
pub struct CurrentUser {
    pub email: String,
    pub id: String,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response<Body> {
        let body = Json(json!({
            "error": self.message,
        }));

        (self.status_code, body).into_response()
    }
}

pub async fn authorize(mut req: Request, next: Next) -> Result<Response<Body>, AuthError> {
    let auth_header = req.headers_mut().get(http::header::AUTHORIZATION);
    let auth_header = match auth_header {
        Some(header) => header.to_str().map_err(|_| AuthError {
            message: "Empty header is not allowed".to_string(),
            status_code: StatusCode::FORBIDDEN
        })?,
        None => return Err(AuthError {
            message: "Please add the JWT token to the header".to_string(),
            status_code: StatusCode::FORBIDDEN
        }),
    };
    let mut header = auth_header.split_whitespace();
    let (_, token) = (header.next(), header.next());
    let token_data = match decode_jwt(token.unwrap().to_string()) {
        Ok(data) => data,
        Err(_) => return Err(AuthError {
            message: "Unable to decode token".to_string(),
            status_code: StatusCode::UNAUTHORIZED
        }),
    };

    let pool = req.extensions().get::<PgPool>().unwrap();

    let user = query!(
        r#"
        SELECT * FROM users WHERE email = $1
        "#,
        &token_data.claims.email
    )
    .fetch_one(pool);

    match user.await {
        Ok(user) => {
            if user.verification_code.is_some() {
                return Err(AuthError {
                    message: "User is not verified".to_string(),
                    status_code: StatusCode::UNAUTHORIZED
                });
            }

            let auth_user = CurrentUser {
                email: user.email.to_string(),
                id: user.id.to_string(),
            };
            req.extensions_mut().insert(auth_user);
            Ok(next.run(req).await)
        }
        Err(_) => {
            return Err(AuthError {
                message: "User not found".to_string(),
                status_code: StatusCode::UNAUTHORIZED
            });
        }
    }
}

pub fn decode_jwt(jwt_token: String) -> Result<TokenData<Claims>, StatusCode> {
    let secret: String = std::env::var("SECRET").expect("SECRET must be set").as_str().to_string();
    let result: Result<TokenData<Claims>, StatusCode> = decode(
        &jwt_token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default(),
    )
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR);
    result
}
