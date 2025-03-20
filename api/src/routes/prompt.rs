use axum::{
    Json,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{to_string};

pub async fn handler(Json(payload): Json<PromptRequest>) -> (StatusCode, Json<PromptResponse>) {
    let api_key = std::env::var("GOOGLE_GENERATIVE_AI_API_KEY").expect("GOOGLE_GENERATIVE_AI_API_KEY must be set");
    let body = AIRequest {
        contents: vec![
            AIContent {
                role: "user".to_string(),
                parts: vec![
                    AIPart {
                        text: format!("The selected text is: {}", payload.context),
                    },
                ],
            },
        ],
        system_instruction: AIContent {
            role: "user".to_string(),
            parts: vec![
                AIPart {
                    text: format!(concat!(
                        "You are a helpful writing assistant. Please help the user to replace the selected text.\n\n",
                        "Your task is: {}\n\n",
                        "Make sure to provide only exact 1 option as a response."
                    ), payload.prompt),
                },
            ],
        },
        generation_config: AIGenerationConfig {
            temperature: 0.7,
            max_output_tokens: 8192,
            top_p: 0.95,
            top_k: 40,
            response_mime_type: "text/plain".to_string(),
        },
    };

    let client = reqwest::Client::new();
    let resp = client.post(format!("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key={}", api_key))
        .body(to_string(&body).unwrap())
        .header("Content-Type", "application/json")
        .send()
        .await;
    match resp {
        Ok(resp) => {
            if resp.status() != StatusCode::OK {
                let err = resp.json::<AIResponseError>().await.unwrap();
                return (StatusCode::BAD_REQUEST, Json(PromptResponse::Error { error: err.error.message }));
            }
            let json = resp.json::<AIResponse>().await.unwrap();
            let result = &json.candidates[0].content.parts[0].text;
            (StatusCode::OK, Json(PromptResponse::Result { result: result.to_string() }))
        }
        Err(err) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(PromptResponse::Error { error: err.to_string() }));
        }
    }
}

#[derive(Deserialize)]
pub struct PromptRequest {
    context: String,
    prompt: String,
}

#[derive(Serialize)]
#[serde(untagged)]
pub enum PromptResponse {
    Result { result: String },
    Error { error: String },
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AIRequest {
    contents: Vec<AIContent>,
    system_instruction: AIContent,
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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AIResponseError {
    error: AIError,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AIError {
    message: String,
}
