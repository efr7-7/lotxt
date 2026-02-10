use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use futures_util::StreamExt;

// ─── Types ───

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiProvider {
    pub id: String,           // "claude", "openai", "gemini", "openrouter"
    pub name: String,
    pub api_key: String,
    pub model: String,        // e.g. "claude-sonnet-4-20250514", "gpt-4o", "gemini-2.0-flash"
    pub base_url: String,     // API endpoint
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiMessage {
    pub role: String,         // "system", "user", "assistant"
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiRequest {
    pub provider_id: String,
    pub messages: Vec<AiMessage>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub system_prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiResponse {
    pub content: String,
    pub provider: String,
    pub model: String,
    pub usage: Option<AiUsage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiUsage {
    pub input_tokens: u32,
    pub output_tokens: u32,
}

// ─── Provider Storage ───
// Store/retrieve AI provider configs from tauri-plugin-store

#[tauri::command]
pub async fn save_ai_provider(app: AppHandle, provider: AiProvider) -> Result<(), String> {
    // Use tauri-plugin-store to save provider config
    // Store key: "ai_provider:{id}"
    // Save all fields including api_key
    use tauri_plugin_store::StoreExt;
    let store = app.store("ai_providers.json").map_err(|e| e.to_string())?;
    let key = format!("provider:{}", provider.id);
    store.set(&key, serde_json::to_value(&provider).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_ai_providers(app: AppHandle) -> Result<Vec<AiProvider>, String> {
    use tauri_plugin_store::StoreExt;
    let store = app.store("ai_providers.json").map_err(|e| e.to_string())?;
    let mut providers = Vec::new();
    for (key, value) in store.entries() {
        if key.starts_with("provider:") {
            if let Ok(provider) = serde_json::from_value::<AiProvider>(value.clone()) {
                providers.push(provider);
            }
        }
    }
    Ok(providers)
}

#[tauri::command]
pub async fn delete_ai_provider(app: AppHandle, provider_id: String) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let store = app.store("ai_providers.json").map_err(|e| e.to_string())?;
    let key = format!("provider:{}", provider_id);
    store.delete(&key);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

// ─── AI Chat Completion ───
// Routes to the correct API based on provider_id

#[tauri::command]
pub async fn ai_chat(app: AppHandle, request: AiRequest) -> Result<AiResponse, String> {
    // 1. Load provider config from store
    use tauri_plugin_store::StoreExt;
    let store = app.store("ai_providers.json").map_err(|e| e.to_string())?;
    let key = format!("provider:{}", request.provider_id);
    let provider_value = store.get(&key).ok_or_else(|| format!("Provider '{}' not found", request.provider_id))?;
    let provider: AiProvider = serde_json::from_value(provider_value.clone()).map_err(|e| e.to_string())?;

    // 2. Route to correct API
    let client = reqwest::Client::new();
    let max_tokens = request.max_tokens.unwrap_or(2048);
    let temperature = request.temperature.unwrap_or(0.7);

    match provider.id.as_str() {
        "claude" => call_anthropic(&client, &provider, &request, max_tokens, temperature).await,
        "openai" => call_openai(&client, &provider, &request, max_tokens, temperature).await,
        "gemini" => call_gemini(&client, &provider, &request, max_tokens, temperature).await,
        "openrouter" => call_openrouter(&client, &provider, &request, max_tokens, temperature).await,
        _ => Err(format!("Unknown provider: {}", provider.id)),
    }
}

// ─── Anthropic (Claude) ───
async fn call_anthropic(
    client: &reqwest::Client,
    provider: &AiProvider,
    request: &AiRequest,
    max_tokens: u32,
    temperature: f32,
) -> Result<AiResponse, String> {
    let url = if provider.base_url.is_empty() {
        "https://api.anthropic.com/v1/messages".to_string()
    } else {
        format!("{}/v1/messages", provider.base_url.trim_end_matches('/'))
    };

    // Build messages (filter out system, use system_prompt field)
    let messages: Vec<serde_json::Value> = request.messages.iter()
        .filter(|m| m.role != "system")
        .map(|m| serde_json::json!({ "role": m.role, "content": m.content }))
        .collect();

    let mut body = serde_json::json!({
        "model": provider.model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
    });

    // Add system prompt if present
    if let Some(ref system) = request.system_prompt {
        body["system"] = serde_json::json!(system);
    }

    let resp = client.post(&url)
        .header("x-api-key", &provider.api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Anthropic request failed: {}", e))?;

    let status = resp.status();
    let text = resp.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("Anthropic API error ({}): {}", status, text));
    }

    let json: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;

    let content = json["content"][0]["text"].as_str().unwrap_or("").to_string();
    let usage = json["usage"].as_object().map(|u| AiUsage {
        input_tokens: u.get("input_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
        output_tokens: u.get("output_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
    });

    Ok(AiResponse {
        content,
        provider: "claude".to_string(),
        model: provider.model.clone(),
        usage,
    })
}

// ─── OpenAI (GPT) ───
async fn call_openai(
    client: &reqwest::Client,
    provider: &AiProvider,
    request: &AiRequest,
    max_tokens: u32,
    temperature: f32,
) -> Result<AiResponse, String> {
    let url = if provider.base_url.is_empty() {
        "https://api.openai.com/v1/chat/completions".to_string()
    } else {
        format!("{}/v1/chat/completions", provider.base_url.trim_end_matches('/'))
    };

    let mut messages: Vec<serde_json::Value> = Vec::new();

    // Add system prompt
    if let Some(ref system) = request.system_prompt {
        messages.push(serde_json::json!({ "role": "system", "content": system }));
    }

    // Add conversation messages
    for m in &request.messages {
        messages.push(serde_json::json!({ "role": m.role, "content": m.content }));
    }

    let body = serde_json::json!({
        "model": provider.model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
    });

    let resp = client.post(&url)
        .header("Authorization", format!("Bearer {}", provider.api_key))
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("OpenAI request failed: {}", e))?;

    let status = resp.status();
    let text = resp.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("OpenAI API error ({}): {}", status, text));
    }

    let json: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;

    let content = json["choices"][0]["message"]["content"].as_str().unwrap_or("").to_string();
    let usage = json["usage"].as_object().map(|u| AiUsage {
        input_tokens: u.get("prompt_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
        output_tokens: u.get("completion_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
    });

    Ok(AiResponse {
        content,
        provider: "openai".to_string(),
        model: provider.model.clone(),
        usage,
    })
}

// ─── Google Gemini ───
async fn call_gemini(
    client: &reqwest::Client,
    provider: &AiProvider,
    request: &AiRequest,
    max_tokens: u32,
    temperature: f32,
) -> Result<AiResponse, String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        provider.model, provider.api_key
    );

    // Build Gemini-format parts
    let mut contents: Vec<serde_json::Value> = Vec::new();

    for m in &request.messages {
        let role = match m.role.as_str() {
            "assistant" => "model",
            _ => "user",
        };
        contents.push(serde_json::json!({
            "role": role,
            "parts": [{ "text": m.content }]
        }));
    }

    let mut body = serde_json::json!({
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature,
        }
    });

    // System instruction
    if let Some(ref system) = request.system_prompt {
        body["systemInstruction"] = serde_json::json!({
            "parts": [{ "text": system }]
        });
    }

    let resp = client.post(&url)
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Gemini request failed: {}", e))?;

    let status = resp.status();
    let text = resp.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("Gemini API error ({}): {}", status, text));
    }

    let json: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;

    let content = json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str().unwrap_or("").to_string();

    let usage = json["usageMetadata"].as_object().map(|u| AiUsage {
        input_tokens: u.get("promptTokenCount").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
        output_tokens: u.get("candidatesTokenCount").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
    });

    Ok(AiResponse {
        content,
        provider: "gemini".to_string(),
        model: provider.model.clone(),
        usage,
    })
}

// ─── OpenRouter ───
async fn call_openrouter(
    client: &reqwest::Client,
    provider: &AiProvider,
    request: &AiRequest,
    max_tokens: u32,
    temperature: f32,
) -> Result<AiResponse, String> {
    let url = if provider.base_url.is_empty() {
        "https://openrouter.ai/api/v1/chat/completions".to_string()
    } else {
        format!("{}/api/v1/chat/completions", provider.base_url.trim_end_matches('/'))
    };

    let mut messages: Vec<serde_json::Value> = Vec::new();

    if let Some(ref system) = request.system_prompt {
        messages.push(serde_json::json!({ "role": "system", "content": system }));
    }

    for m in &request.messages {
        messages.push(serde_json::json!({ "role": m.role, "content": m.content }));
    }

    let body = serde_json::json!({
        "model": provider.model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
    });

    let resp = client.post(&url)
        .header("Authorization", format!("Bearer {}", provider.api_key))
        .header("HTTP-Referer", "https://station.app")
        .header("X-Title", "Station")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("OpenRouter request failed: {}", e))?;

    let status = resp.status();
    let text = resp.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("OpenRouter API error ({}): {}", status, text));
    }

    let json: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;

    let content = json["choices"][0]["message"]["content"].as_str().unwrap_or("").to_string();
    let usage = json["usage"].as_object().map(|u| AiUsage {
        input_tokens: u.get("prompt_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
        output_tokens: u.get("completion_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
    });

    Ok(AiResponse {
        content,
        provider: "openrouter".to_string(),
        model: provider.model.clone(),
        usage,
    })
}

// ─── Streaming AI Chat ──────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
struct StreamChunk {
    chunk: String,
    done: bool,
    request_id: String,
}

#[derive(Debug, Clone, Serialize)]
struct StreamError {
    request_id: String,
    error: String,
}

#[tauri::command]
pub async fn ai_chat_stream(
    app: AppHandle,
    request: AiRequest,
    request_id: String,
) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let store = app.store("ai_providers.json").map_err(|e| e.to_string())?;
    let key = format!("provider:{}", request.provider_id);
    let provider_value = store
        .get(&key)
        .ok_or_else(|| format!("Provider '{}' not found", request.provider_id))?;
    let provider: AiProvider =
        serde_json::from_value(provider_value.clone()).map_err(|e| e.to_string())?;

    let max_tokens = request.max_tokens.unwrap_or(2048);
    let temperature = request.temperature.unwrap_or(0.7);

    tokio::spawn(async move {
        let result = match provider.id.as_str() {
            "claude" => {
                stream_anthropic(&app, &provider, &request, max_tokens, temperature, &request_id)
                    .await
            }
            "openai" => {
                stream_openai_compatible(
                    &app,
                    &provider,
                    &request,
                    max_tokens,
                    temperature,
                    &request_id,
                    false,
                )
                .await
            }
            "openrouter" => {
                stream_openai_compatible(
                    &app,
                    &provider,
                    &request,
                    max_tokens,
                    temperature,
                    &request_id,
                    true,
                )
                .await
            }
            "gemini" => {
                // Gemini doesn't have simple SSE streaming — fall back to non-streaming
                let client = reqwest::Client::new();
                match call_gemini(&client, &provider, &request, max_tokens, temperature).await {
                    Ok(resp) => {
                        let _ = app.emit(
                            "ai-stream-chunk",
                            StreamChunk {
                                chunk: resp.content,
                                done: true,
                                request_id: request_id.clone(),
                            },
                        );
                        Ok(())
                    }
                    Err(e) => Err(e),
                }
            }
            _ => Err(format!("Unknown provider: {}", provider.id)),
        };

        if let Err(e) = result {
            let _ = app.emit(
                "ai-stream-error",
                StreamError {
                    request_id,
                    error: e,
                },
            );
        }
    });

    Ok(())
}

async fn stream_anthropic(
    app: &AppHandle,
    provider: &AiProvider,
    request: &AiRequest,
    max_tokens: u32,
    temperature: f32,
    request_id: &str,
) -> Result<(), String> {
    let url = if provider.base_url.is_empty() {
        "https://api.anthropic.com/v1/messages".to_string()
    } else {
        format!("{}/v1/messages", provider.base_url.trim_end_matches('/'))
    };

    let messages: Vec<serde_json::Value> = request
        .messages
        .iter()
        .filter(|m| m.role != "system")
        .map(|m| serde_json::json!({ "role": m.role, "content": m.content }))
        .collect();

    let mut body = serde_json::json!({
        "model": provider.model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
        "stream": true,
    });

    if let Some(ref system) = request.system_prompt {
        body["system"] = serde_json::json!(system);
    }

    let client = reqwest::Client::new();
    let resp = client
        .post(&url)
        .header("x-api-key", &provider.api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Anthropic stream request failed: {}", e))?;

    if !resp.status().is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Anthropic API error: {}", text));
    }

    let mut stream = resp.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.starts_with("data: ") {
                let data = &line[6..];
                if data == "[DONE]" {
                    let _ = app.emit(
                        "ai-stream-chunk",
                        StreamChunk {
                            chunk: String::new(),
                            done: true,
                            request_id: request_id.to_string(),
                        },
                    );
                    return Ok(());
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if json["type"] == "content_block_delta" {
                        if let Some(text) = json["delta"]["text"].as_str() {
                            let _ = app.emit(
                                "ai-stream-chunk",
                                StreamChunk {
                                    chunk: text.to_string(),
                                    done: false,
                                    request_id: request_id.to_string(),
                                },
                            );
                        }
                    } else if json["type"] == "message_stop" {
                        let _ = app.emit(
                            "ai-stream-chunk",
                            StreamChunk {
                                chunk: String::new(),
                                done: true,
                                request_id: request_id.to_string(),
                            },
                        );
                        return Ok(());
                    }
                }
            }
        }
    }

    // Stream ended without message_stop — send done
    let _ = app.emit(
        "ai-stream-chunk",
        StreamChunk {
            chunk: String::new(),
            done: true,
            request_id: request_id.to_string(),
        },
    );
    Ok(())
}

async fn stream_openai_compatible(
    app: &AppHandle,
    provider: &AiProvider,
    request: &AiRequest,
    max_tokens: u32,
    temperature: f32,
    request_id: &str,
    is_openrouter: bool,
) -> Result<(), String> {
    let url = if provider.base_url.is_empty() {
        if is_openrouter {
            "https://openrouter.ai/api/v1/chat/completions".to_string()
        } else {
            "https://api.openai.com/v1/chat/completions".to_string()
        }
    } else {
        let base = provider.base_url.trim_end_matches('/');
        if is_openrouter {
            format!("{}/api/v1/chat/completions", base)
        } else {
            format!("{}/v1/chat/completions", base)
        }
    };

    let mut messages: Vec<serde_json::Value> = Vec::new();
    if let Some(ref system) = request.system_prompt {
        messages.push(serde_json::json!({ "role": "system", "content": system }));
    }
    for m in &request.messages {
        messages.push(serde_json::json!({ "role": m.role, "content": m.content }));
    }

    let body = serde_json::json!({
        "model": provider.model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
        "stream": true,
    });

    let client = reqwest::Client::new();
    let mut req = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", provider.api_key))
        .header("content-type", "application/json");

    if is_openrouter {
        req = req
            .header("HTTP-Referer", "https://station.app")
            .header("X-Title", "Station");
    }

    let resp = req
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Stream request failed: {}", e))?;

    if !resp.status().is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("API error: {}", text));
    }

    let mut stream = resp.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.starts_with("data: ") {
                let data = &line[6..];
                if data == "[DONE]" {
                    let _ = app.emit(
                        "ai-stream-chunk",
                        StreamChunk {
                            chunk: String::new(),
                            done: true,
                            request_id: request_id.to_string(),
                        },
                    );
                    return Ok(());
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(text) = json["choices"][0]["delta"]["content"].as_str() {
                        let _ = app.emit(
                            "ai-stream-chunk",
                            StreamChunk {
                                chunk: text.to_string(),
                                done: false,
                                request_id: request_id.to_string(),
                            },
                        );
                    }
                }
            }
        }
    }

    let _ = app.emit(
        "ai-stream-chunk",
        StreamChunk {
            chunk: String::new(),
            done: true,
            request_id: request_id.to_string(),
        },
    );
    Ok(())
}
