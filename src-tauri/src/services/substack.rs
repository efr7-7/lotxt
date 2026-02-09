use reqwest::Client;

use crate::commands::platform::{
    AnalyticsData, GrowthPoint, PostPerformance, Publication, PublishRequest, Subscriber,
};
use crate::services::PlatformService;

pub struct SubstackService;

// ─── Substack Integration ───────────────────────────────────────
//
// IMPORTANT: Substack does NOT have an official public API.
// This integration uses known endpoints that may change without notice.
// Users should be warned about this limitation in the UI.
//
// For now, Substack integration works through:
// 1. A user's subdomain (e.g., "mynewsletter" for mynewsletter.substack.com)
// 2. Public endpoints that don't require auth for reading
// 3. Session cookie-based auth for writing (captured from browser)
//
// The "api_key" field for Substack stores a JSON object:
// { "subdomain": "mynewsletter", "cookie": "substack.sid=..." }

use serde::Deserialize;

#[derive(Deserialize)]
struct SubstackConfig {
    subdomain: String,
    cookie: Option<String>,
}

#[derive(Deserialize)]
struct SubstackPost {
    id: u64,
    title: String,
    post_date: Option<String>,
    audience_stats: Option<SubstackAudienceStats>,
}

#[derive(Deserialize)]
struct SubstackAudienceStats {
    opens: Option<u64>,
    clicks: Option<u64>,
}

fn parse_config(api_key: &str) -> Result<SubstackConfig, String> {
    serde_json::from_str(api_key)
        .map_err(|_| "Invalid Substack config. Expected JSON with 'subdomain' field.".to_string())
}

fn client_with_cookie(cookie: Option<&str>) -> Result<Client, String> {
    let mut builder = Client::builder();
    if let Some(c) = cookie {
        let mut h = reqwest::header::HeaderMap::new();
        h.insert(reqwest::header::COOKIE, c.parse().unwrap());
        builder = builder.default_headers(h);
    }
    builder.build().map_err(|e| e.to_string())
}

impl PlatformService for SubstackService {
    async fn validate_connection(api_key: &str) -> Result<bool, String> {
        let config = parse_config(api_key)?;
        let c = Client::new();
        let resp = c
            .get(format!(
                "https://{}.substack.com/api/v1/archive?limit=1",
                config.subdomain
            ))
            .send()
            .await
            .map_err(|e| e.to_string())?;
        Ok(resp.status().is_success())
    }

    async fn get_publications(api_key: &str) -> Result<Vec<Publication>, String> {
        let config = parse_config(api_key)?;

        // Substack public profile endpoint
        let c = Client::new();
        let url = format!("https://{}.substack.com", config.subdomain);

        Ok(vec![Publication {
            id: config.subdomain.clone(),
            name: config.subdomain.clone(),
            url,
            platform: "substack".to_string(),
            subscriber_count: None,
            description: Some(
                "⚠️ Substack has no official API. Some features may be limited.".to_string(),
            ),
        }])
    }

    async fn get_subscribers(
        api_key: &str,
        _publication_id: Option<&str>,
    ) -> Result<Vec<Subscriber>, String> {
        let config = parse_config(api_key)?;
        let cookie = config.cookie.as_deref();
        let c = client_with_cookie(cookie)?;

        // Substack subscriber export requires auth
        if cookie.is_none() {
            return Err(
                "Substack subscriber data requires authentication. Please add your session cookie."
                    .to_string(),
            );
        }

        let resp = c
            .get(format!(
                "https://{}.substack.com/api/v1/subscriber_count",
                config.subdomain
            ))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err(format!(
                "Substack API error: {}. The unofficial API may have changed.",
                resp.status()
            ));
        }

        // Substack doesn't expose individual subscriber emails through any known API
        // Return empty with a note
        Ok(vec![])
    }

    async fn get_analytics(
        api_key: &str,
        _publication_id: Option<&str>,
    ) -> Result<AnalyticsData, String> {
        let config = parse_config(api_key)?;
        let c = Client::new();

        // Fetch recent posts from public archive
        let resp = c
            .get(format!(
                "https://{}.substack.com/api/v1/archive?sort=new&limit=50",
                config.subdomain
            ))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let mut recent_posts = Vec::new();

        if resp.status().is_success() {
            let posts: Vec<SubstackPost> =
                resp.json().await.unwrap_or_default();

            for post in &posts {
                let (opens, clicks) = if let Some(stats) = &post.audience_stats {
                    (stats.opens.unwrap_or(0), stats.clicks.unwrap_or(0))
                } else {
                    (0, 0)
                };

                recent_posts.push(PostPerformance {
                    id: post.id.to_string(),
                    title: post.title.clone(),
                    published_at: post.post_date.clone().unwrap_or_default(),
                    opens,
                    clicks,
                    unsubscribes: 0, // Not available via public API
                    platform: "substack".to_string(),
                });
            }
        }

        // Try to get subscriber count if cookie auth is available
        let total_subscribers = if config.cookie.is_some() {
            let c2 = client_with_cookie(config.cookie.as_deref())?;
            let resp = c2
                .get(format!(
                    "https://{}.substack.com/api/v1/subscriber_count",
                    config.subdomain
                ))
                .send()
                .await
                .ok();

            if let Some(r) = resp {
                if r.status().is_success() {
                    let body: serde_json::Value = r.json().await.unwrap_or_default();
                    body.as_u64().unwrap_or(0)
                } else {
                    0
                }
            } else {
                0
            }
        } else {
            0
        };

        Ok(AnalyticsData {
            total_subscribers,
            open_rate: 0.0, // Not reliably available without dashboard access
            click_rate: 0.0,
            subscriber_growth: vec![],
            recent_posts,
        })
    }

    async fn publish(
        api_key: &str,
        _publication_id: &str,
        request: PublishRequest,
    ) -> Result<String, String> {
        let config = parse_config(api_key)?;
        let cookie = config
            .cookie
            .as_deref()
            .ok_or("Substack publishing requires session authentication")?;
        let c = client_with_cookie(Some(cookie))?;

        let body = serde_json::json!({
            "draft_title": request.title,
            "draft_subtitle": request.subtitle.unwrap_or_default(),
            "draft_body": serde_json::json!({
                "type": "doc",
                "content": [
                    {
                        "type": "rawhtml",
                        "content": request.html_content
                    }
                ]
            }),
            "type": "newsletter",
        });

        let resp = c
            .post(format!(
                "https://{}.substack.com/api/v1/drafts",
                config.subdomain
            ))
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            let err_text = resp.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!(
                "Substack publish error: {}. The unofficial API may have changed.",
                err_text
            ));
        }

        let result: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
        let id = result
            .get("id")
            .and_then(|id| id.as_u64())
            .map(|id| id.to_string())
            .unwrap_or_else(|| "draft-created".to_string());

        Ok(id)
    }
}
