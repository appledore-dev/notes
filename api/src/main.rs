use axum::{
  routing::get,
  Router,
};

#[tokio::main]
async fn main() {
  let app = Router::new()
      .route("/", get(root));

  let listener = tokio::net::TcpListener::bind("0.0.0.0:4002").await.unwrap();
  axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
  "Hello, World!"
}
