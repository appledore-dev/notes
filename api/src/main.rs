use axum::{
  	routing::{get, post},
  	Json, Router,
	http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[tokio::main]
async fn main() {
  	let app = Router::new()
		.route("/", get(
			|| async { Json(json!({ "ping": 1 })) }
		))
		.route("/prompt", post(prompt));

  	let listener = tokio::net::TcpListener::bind("0.0.0.0:4002").await.unwrap();
  	axum::serve(listener, app).await.unwrap();
}

async fn prompt(Json(payload): Json<PromptRequest>) -> (StatusCode, Json<PromptResponse>) {
    let client = reqwest::Client::new();
	let resp = client.post(format!("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={}", "key"))
        .body(json!({
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": payload.prompt
                        }
                    ]
                },
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 8192,
                "topP": 0.95,
                "topK": 40,
                "responseMimeType": "text/plain",
            },
        }).to_string())
        .header("Content-Type", "application/json")
        .send()
        .await;
	let json = resp.unwrap().json::<Value>().await.unwrap();
    println!("Response: {:?}", json);
	let res = PromptResponse {
		result: format!("Hello, {}!", payload.prompt),
	};
	(StatusCode::OK, Json(res))
}

#[derive(Deserialize)]
struct PromptRequest {
	context: String,
	prompt: String,
}

#[derive(Serialize)]
struct PromptResponse {
	result: String,
}
