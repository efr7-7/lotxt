use hmac::{Hmac, Mac};
use sha1::Sha1;
use serde::Deserialize;

type HmacSha1 = Hmac<Sha1>;

// ─── Twitter credential format ─────────────────────────────────

#[derive(Deserialize)]
pub struct TwitterConfig {
    pub api_key: String,
    pub api_secret: String,
    pub access_token: String,
    pub access_secret: String,
}

pub struct TwitterService;

// ─── Response types ─────────────────────────────────────────────

#[derive(Deserialize)]
struct TweetResponse {
    data: TweetData,
}

#[derive(Deserialize)]
struct TweetData {
    id: String,
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct TwitterUser {
    data: TwitterUserData,
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct TwitterUserData {
    id: String,
    name: String,
}

// ─── OAuth 1.0a signing ────────────────────────────────────────

fn percent_encode(s: &str) -> String {
    let mut result = String::new();
    for byte in s.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'.' | b'_' | b'~' => {
                result.push(byte as char);
            }
            _ => {
                result.push_str(&format!("%{:02X}", byte));
            }
        }
    }
    result
}

fn generate_nonce() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let t = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{:x}", t)
}

fn generate_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        .to_string()
}

fn sign_request(
    method: &str,
    url: &str,
    params: &[(String, String)],
    config: &TwitterConfig,
) -> String {
    // Sort params
    let mut sorted = params.to_vec();
    sorted.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.cmp(&b.1)));

    let param_string: String = sorted
        .iter()
        .map(|(k, v)| format!("{}={}", percent_encode(k), percent_encode(v)))
        .collect::<Vec<_>>()
        .join("&");

    let base_string = format!(
        "{}&{}&{}",
        method.to_uppercase(),
        percent_encode(url),
        percent_encode(&param_string)
    );

    let signing_key = format!(
        "{}&{}",
        percent_encode(&config.api_secret),
        percent_encode(&config.access_secret)
    );

    let mut mac = HmacSha1::new_from_slice(signing_key.as_bytes()).unwrap();
    mac.update(base_string.as_bytes());
    let result = mac.finalize();

    use base64::Engine;
    base64::engine::general_purpose::STANDARD.encode(result.into_bytes())
}

fn build_auth_header(
    method: &str,
    url: &str,
    body_params: &[(String, String)],
    config: &TwitterConfig,
) -> String {
    let nonce = generate_nonce();
    let timestamp = generate_timestamp();

    let mut oauth_params = vec![
        ("oauth_consumer_key".to_string(), config.api_key.clone()),
        ("oauth_nonce".to_string(), nonce.clone()),
        ("oauth_signature_method".to_string(), "HMAC-SHA1".to_string()),
        ("oauth_timestamp".to_string(), timestamp.clone()),
        ("oauth_token".to_string(), config.access_token.clone()),
        ("oauth_version".to_string(), "1.0".to_string()),
    ];

    // Combine with body params for signing
    let mut all_params = oauth_params.clone();
    all_params.extend(body_params.iter().cloned());

    let signature = sign_request(method, url, &all_params, config);
    oauth_params.push(("oauth_signature".to_string(), signature));

    let header_parts: Vec<String> = oauth_params
        .iter()
        .map(|(k, v)| format!("{}=\"{}\"", percent_encode(k), percent_encode(v)))
        .collect();

    format!("OAuth {}", header_parts.join(", "))
}

impl TwitterService {
    pub async fn validate(api_key: &str) -> Result<bool, String> {
        let config: TwitterConfig =
            serde_json::from_str(api_key).map_err(|e| format!("Invalid Twitter config: {}", e))?;

        let url = "https://api.twitter.com/2/users/me";
        let auth = build_auth_header("GET", url, &[], &config);

        let client = reqwest::Client::new();
        let resp = client
            .get(url)
            .header("Authorization", auth)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        Ok(resp.status().is_success())
    }

    pub async fn post_tweet(api_key: &str, content: &str) -> Result<String, String> {
        let config: TwitterConfig =
            serde_json::from_str(api_key).map_err(|e| format!("Invalid Twitter config: {}", e))?;

        let url = "https://api.twitter.com/2/tweets";
        let body = serde_json::json!({ "text": content });

        // For JSON body requests, don't include body params in OAuth signature
        let auth = build_auth_header("POST", url, &[], &config);

        let client = reqwest::Client::new();
        let resp = client
            .post(url)
            .header("Authorization", auth)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Twitter post failed: {}", e))?;

        if !resp.status().is_success() {
            let err = resp.text().await.unwrap_or_default();
            return Err(format!("Twitter API error: {}", err));
        }

        let result: TweetResponse = resp.json().await.map_err(|e| e.to_string())?;
        Ok(result.data.id)
    }

    pub async fn post_thread(api_key: &str, tweets: Vec<String>) -> Result<Vec<String>, String> {
        if tweets.is_empty() {
            return Err("Thread must have at least one tweet".to_string());
        }

        let config: TwitterConfig =
            serde_json::from_str(api_key).map_err(|e| format!("Invalid Twitter config: {}", e))?;

        let client = reqwest::Client::new();
        let url = "https://api.twitter.com/2/tweets";
        let mut tweet_ids = Vec::new();

        for (i, text) in tweets.iter().enumerate() {
            let mut body = serde_json::json!({ "text": text });

            // Chain replies after first tweet
            if i > 0 {
                if let Some(prev_id) = tweet_ids.last() {
                    body["reply"] = serde_json::json!({
                        "in_reply_to_tweet_id": prev_id
                    });
                }
            }

            let auth = build_auth_header("POST", url, &[], &config);

            let resp = client
                .post(url)
                .header("Authorization", auth)
                .header("Content-Type", "application/json")
                .json(&body)
                .send()
                .await
                .map_err(|e| format!("Twitter thread post {} failed: {}", i + 1, e))?;

            if !resp.status().is_success() {
                let err = resp.text().await.unwrap_or_default();
                return Err(format!("Twitter thread error on tweet {}: {}", i + 1, err));
            }

            let result: TweetResponse = resp.json().await.map_err(|e| e.to_string())?;
            tweet_ids.push(result.data.id);
        }

        Ok(tweet_ids)
    }
}
