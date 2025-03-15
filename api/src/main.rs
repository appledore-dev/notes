mod prompt;

use axum::{
    routing::post,
    Router,
};
use tower_http::cors::{CorsLayer};
use dotenvy::dotenv;

#[tokio::main]
async fn main() {
    dotenv().expect("Failed to load .env file");
    let app = Router::new()
        .route("/prompt", post(prompt::handler))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:4002").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
