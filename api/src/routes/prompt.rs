use axum::{
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

pub async fn handler(Json(payload): Json<PromptRequest>) -> (StatusCode, Json<PromptResponse>) {
    let prompt = payload.prompt;
    let context = payload.context;

    let api_key = std::env::var("ROUTER_AI_API_KEY").expect("ROUTER_AI_API_KEY must be set");
    let body = AIRequest {
        model: default_model(),
        messages: vec![
            AIMessage {
                role: "system".to_string(),
                content: format!(concat!(
                    "You are a helpful writing assistant. Please help the user to replace the selected text.\n\n",
                    "Your task is: {}\n\n",
                    "Make sure to provide only exact 1 option as a response."
                ), prompt),
            },
            AIMessage {
                role: "user".to_string(),
                content: format!("The selected text is: {}", context),
            },
        ],
        stream: false,
        reasoning: AIReasoning {
            effort: "none".to_string(),
        },
    };

    let client = reqwest::Client::new();
    let resp = client.post("https://router.helpedby.ai/v1/chat/completions")
        .json(&body)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await;
    match resp {
        Ok(resp) => {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();

            if !status.is_success() {
                if let Ok(err) = serde_json::from_str::<AIResponseError>(&text) {
                    return (StatusCode::BAD_REQUEST, Json(PromptResponse::Error { error: err.error.message }));
                }

                return (StatusCode::BAD_REQUEST, Json(PromptResponse::Error { error: text }));
            }

            match serde_json::from_str::<AIResponse>(&text) {
                Ok(json) => {
                    let result = json
                        .choices
                        .first()
                        .and_then(|choice| choice.message.content.as_deref())
                        .unwrap_or_default();

                    (StatusCode::OK, Json(PromptResponse::Result { result: result.to_string() }))
                }
                Err(err) => (
                    StatusCode::BAD_REQUEST,
                    Json(PromptResponse::Error {
                        error: format!("Failed to decode AI response: {}", err),
                    }),
                ),
            }
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
    model: String,
    messages: Vec<AIMessage>,
    stream: bool,
    reasoning: AIReasoning,
}

fn default_model() -> String {
    "basic.free".to_string()
}

#[derive(Serialize)]
struct AIMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AIReasoning {
    effort: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AIResponse {
    choices: Vec<AIChoice>,
}

#[derive(Deserialize)]
struct AIChoice {
    message: AIResponseMessage,
}

#[derive(Deserialize)]
struct AIResponseMessage {
    content: Option<String>,
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
