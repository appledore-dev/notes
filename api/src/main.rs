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
        .route("/me",
            get(routes::me::handler)
            .layer(middleware::from_fn(auth::authorize)))
        .route("/docs",
            get(routes::docs::get_handler).post(routes::docs::post_handler)
            .layer(middleware::from_fn(auth::authorize)))
        .route("/docs/{doc_id}",
            get(routes::docdetails::get_handler)
            .put(routes::docdetails::put_handler)
            .delete(routes::docdetails::delete_handler)
            .layer(middleware::from_fn(auth::authorize)))
        .layer(CorsLayer::permissive())
        .layer(Extension(pool));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:4012").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
