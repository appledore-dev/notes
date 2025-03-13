use axum::{
  	routing::{get, post},
  	Json, Router,
	http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, to_string};
use dotenv::dotenv;

#[tokio::main]
async fn main() {
    dotenv().ok();
  	let app = Router::new()
		.route("/", get(
			|| async { Json(json!({ "ping": 1 })) }
		))
		.route("/prompt", post(prompt));

  	let listener = tokio::net::TcpListener::bind("0.0.0.0:4002").await.unwrap();
  	axum::serve(listener, app).await.unwrap();
}

async fn prompt(Json(payload): Json<PromptRequest>) -> (StatusCode, Json<PromptResponse>) {
    let api_key = std::env::var("GOOGLE_GENERATIVE_AI_API_KEY").expect("GOOGLE_GENERATIVE_AI_API_KEY must be set");
    let body = AIRequest {
        contents: vec![
            AIContent {
                role: "user".to_string(),
                parts: vec![
                    AIPart {
                        text: payload.prompt,
                    },
                ],
            },
        ],
        generation_config: AIGenerationConfig {
            temperature: 0.7,
            max_output_tokens: 8192,
            top_p: 0.95,
            top_k: 40,
            response_mime_type: "text/plain".to_string(),
        },
    };

    let client = reqwest::Client::new();
	let resp = client.post(format!("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={}", api_key))
        .body(to_string(&body).unwrap())
        .header("Content-Type", "application/json")
        .send()
        .await;
	let data = resp.unwrap().json::<AIResponse>().await.unwrap();
    let res = PromptResponse {
		result: data.candidates[0].content.parts[0].text.to_string(),
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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AIRequest {
    contents: Vec<AIContent>,
    generation_config: AIGenerationConfig,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AIContent {
    role: String,
    parts: Vec<AIPart>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AIPart {
    text: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AIGenerationConfig {
    temperature: f32,
    max_output_tokens: i32,
    top_p: f32,
    top_k: i32,
    response_mime_type: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AIResponse {
    candidates: Vec<AICandidate>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AICandidate {
    content: AIContentCandidate,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AIContentCandidate {
    parts: Vec<AIPartCandidate>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AIPartCandidate {
    text: String,
}
