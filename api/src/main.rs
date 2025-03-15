mod prompt;

use axum::{
    routing::post,
    Router,
};
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{CorsLayer};

#[tokio::main]
async fn main() {
    dotenv().expect("Failed to load .env file");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(
            std::env::var("DATABASE_URL").expect("DATABASE_URL must be set").as_str()
        ).await;

    let app = Router::new()
        .route("/prompt", post(prompt::handler))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:4002").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
