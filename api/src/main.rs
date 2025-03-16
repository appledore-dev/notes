mod auth;
mod routes;

use axum::{
    middleware,
    routing::{post, get},
    Extension, Router,
};
use dotenvy::dotenv;
use sqlx::postgres::PgPool;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    dotenv().expect("Failed to load .env file");

    let pool = PgPool::connect(
            std::env::var("DATABASE_URL").expect("DATABASE_URL must be set").as_str()
        )
        .await
        .expect("Failed to create pool");

    let app = Router::new()
        .route("/otp", post(routes::otp::handler))
        .route("/otp-verify", post(routes::otpverify::handler))
        .route("/prompt", post(routes::prompt::handler))
        .route("/docs",
            get(routes::docs::get_handler).post(routes::docs::post_handler)
            .layer(middleware::from_fn(auth::authorize))
        )
        .layer(CorsLayer::permissive())
        .layer(Extension(pool));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:4002").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
