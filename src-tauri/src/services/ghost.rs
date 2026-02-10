use reqwest::Client;
use serde::Deserialize;

use crate::commands::platform::{
    AnalyticsData, ImportedPost, PostPerformance, Publication, PublishRequest, Subscriber,
};
use crate::services::PlatformService;

pub struct GhostService;

// ─── Ghost config & response types ─────────────────────────────

#[derive(Deserialize)]
struct GhostConfig {
    api_url: String,
    api_key: String, // "{key_id}:{hex_secret}"
}

#[derive(Deserialize)]
struct GhostSiteResponse {
    site: GhostSite,
}

#[derive(Deserialize)]
struct GhostSite {
    title: Option<String>,
    url: Option<String>,
    description: Option<String>,
}

#[derive(Deserialize)]
struct GhostPostsResponse {
    posts: Vec<GhostPost>,
    #[allow(dead_code)]
    meta: Option<GhostMeta>,
}

#[derive(Deserialize)]
struct GhostPost {
    id: String,
    title: Option<String>,
    html: Option<String>,
    #[allow(dead_code)]
    status: Option<String>,
    published_at: Option<String>,
    url: Option<String>,
}

#[derive(Deserialize)]
struct GhostMembersResponse {
    members: Vec<GhostMember>,
    meta: Option<GhostMeta>,
}

#[derive(Deserialize)]
struct GhostMember {
    id: String,
    email: String,
    status: Option<String>,
    created_at: Option<String>,
}

#[derive(Deserialize)]
struct GhostMeta {
    pagination: Option<GhostPagination>,
}

#[derive(Deserialize)]
struct GhostPagination {
    total: Option<u64>,
}

#[derive(Deserialize)]
struct GhostCreateResponse {
    posts: Vec<GhostCreatedPost>,
}

#[derive(Deserialize)]
struct GhostCreatedPost {
    id: String,
}

// ─── Helpers ────────────────────────────────────────────────────

fn hex_decode(hex: &str) -> Result<Vec<u8>, String> {
    if hex.len() % 2 != 0 {
        return Err("Hex string must have even length".to_string());
    }
    (0..hex.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).map_err(|e| e.to_string()))
        .collect()
}

fn parse_config(api_key: &str) -> Result<GhostConfig, String> {
    serde_json::from_str(api_key)
        .map_err(|_| "Invalid Ghost config. Expected JSON with 'api_url' and 'api_key'.".to_string())
}

fn generate_jwt(ghost_api_key: &str) -> Result<String, String> {
    let parts: Vec<&str> = ghost_api_key.splitn(2, ':').collect();
    if parts.len() != 2 {
        return Err("Invalid Ghost API key format. Expected 'id:secret'.".to_string());
    }
    let key_id = parts[0];
    let secret_hex = parts[1];

    let secret_bytes =
        hex_decode(secret_hex).map_err(|_| "Invalid Ghost API secret (not valid hex)".to_string())?;

    let now = chrono::Utc::now().timestamp() as u64;

    let claims = serde_json::json!({
        "iat": now,
        "exp": now + 300,
        "aud": "/admin/",
    });

    let mut header = jsonwebtoken::Header::new(jsonwebtoken::Algorithm::HS256);
    header.kid = Some(key_id.to_string());
    header.typ = Some("JWT".to_string());

    jsonwebtoken::encode(
        &header,
        &claims,
        &jsonwebtoken::EncodingKey::from_secret(&secret_bytes),
    )
    .map_err(|e| format!("Failed to generate Ghost JWT: {}", e))
}

fn ghost_client(jwt: &str) -> Result<Client, String> {
    Client::builder()
        .default_headers({
            let mut h = reqwest::header::HeaderMap::new();
            h.insert(
                reqwest::header::AUTHORIZATION,
                format!("Ghost {}", jwt).parse().unwrap(),
            );
            h.insert(
                reqwest::header::CONTENT_TYPE,
                "application/json".parse().unwrap(),
            );
            h
        })
        .build()
        .map_err(|e| e.to_string())
}

// ─── PlatformService implementation ─────────────────────────────

impl PlatformService for GhostService {
    async fn validate_connection(api_key: &str) -> Result<bool, String> {
        let config = parse_config(api_key)?;
        let jwt = generate_jwt(&config.api_key)?;
        let c = ghost_client(&jwt)?;

        let resp = c
            .get(format!(
                "{}/ghost/api/admin/site/",
                config.api_url.trim_end_matches('/')
            ))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        Ok(resp.status().is_success())
    }

    async fn get_publications(api_key: &str) -> Result<Vec<Publication>, String> {
        let config = parse_config(api_key)?;
        let jwt = generate_jwt(&config.api_key)?;
        let c = ghost_client(&jwt)?;

        let resp = c
            .get(format!(
                "{}/ghost/api/admin/site/",
                config.api_url.trim_end_matches('/')
            ))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err(format!("Ghost API error: {}", resp.status()));
        }

        let body: GhostSiteResponse = resp.json().await.map_err(|e| e.to_string())?;

        Ok(vec![Publication {
            id: "default".to_string(),
            name: body.site.title.unwrap_or_else(|| "Ghost Blog".to_string()),
            url: body
                .site
                .url
                .unwrap_or_else(|| config.api_url.clone()),
            platform: "ghost".to_string(),
            subscriber_count: None,
            description: body.site.description,
        }])
    }

    async fn get_subscribers(
        api_key: &str,
        _publication_id: Option<&str>,
    ) -> Result<Vec<Subscriber>, String> {
        let config = parse_config(api_key)?;
        let jwt = generate_jwt(&config.api_key)?;
        let c = ghost_client(&jwt)?;

        let resp = c
            .get(format!(
                "{}/ghost/api/admin/members/",
                config.api_url.trim_end_matches('/')
            ))
            .query(&[("limit", "100")])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err(format!("Ghost API error: {}", resp.status()));
        }

        let body: GhostMembersResponse = resp.json().await.map_err(|e| e.to_string())?;

        Ok(body
            .members
            .into_iter()
            .map(|m| Subscriber {
                id: m.id,
                email: m.email,
                status: m.status.unwrap_or_else(|| "free".to_string()),
                created_at: m.created_at.unwrap_or_default(),
                platform: "ghost".to_string(),
            })
            .collect())
    }

    async fn get_analytics(
        api_key: &str,
        _publication_id: Option<&str>,
    ) -> Result<AnalyticsData, String> {
        let config = parse_config(api_key)?;
        let jwt = generate_jwt(&config.api_key)?;
        let c = ghost_client(&jwt)?;

        // Get member count
        let members_resp = c
            .get(format!(
                "{}/ghost/api/admin/members/",
                config.api_url.trim_end_matches('/')
            ))
            .query(&[("limit", "1")])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let total_subscribers: u64 = if members_resp.status().is_success() {
            let body: GhostMembersResponse =
                members_resp.json().await.map_err(|e| e.to_string())?;
            body.meta
                .and_then(|m| m.pagination)
                .and_then(|p| p.total)
                .unwrap_or(0)
        } else {
            0
        };

        // Get recent posts
        let posts_resp = c
            .get(format!(
                "{}/ghost/api/admin/posts/",
                config.api_url.trim_end_matches('/')
            ))
            .query(&[("limit", "50"), ("order", "published_at desc")])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let mut recent_posts = Vec::new();

        if posts_resp.status().is_success() {
            let body: GhostPostsResponse = posts_resp.json().await.map_err(|e| e.to_string())?;
            for post in body.posts {
                recent_posts.push(PostPerformance {
                    id: post.id,
                    title: post.title.unwrap_or_else(|| "Untitled".to_string()),
                    published_at: post.published_at.unwrap_or_default(),
                    opens: 0,     // Ghost doesn't expose email open stats via Admin API
                    clicks: 0,
                    unsubscribes: 0,
                    platform: "ghost".to_string(),
                });
            }
        }

        Ok(AnalyticsData {
            total_subscribers,
            open_rate: 0.0, // Ghost Admin API doesn't expose email engagement rates
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
        let jwt = generate_jwt(&config.api_key)?;
        let c = ghost_client(&jwt)?;

        let body = serde_json::json!({
            "posts": [{
                "title": request.title,
                "html": request.html_content,
                "status": request.status,
            }]
        });

        let resp = c
            .post(format!(
                "{}/ghost/api/admin/posts/",
                config.api_url.trim_end_matches('/')
            ))
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            let err_text = resp
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Ghost publish error: {}", err_text));
        }

        let result: GhostCreateResponse = resp.json().await.map_err(|e| e.to_string())?;
        result
            .posts
            .first()
            .map(|p| p.id.clone())
            .ok_or_else(|| "No post returned from Ghost".to_string())
    }
}

// ─── Import (standalone, not on trait) ──────────────────────────

impl GhostService {
    pub async fn import_posts(api_key: &str) -> Result<Vec<ImportedPost>, String> {
        let config = parse_config(api_key)?;
        let jwt = generate_jwt(&config.api_key)?;
        let c = ghost_client(&jwt)?;

        let resp = c
            .get(format!(
                "{}/ghost/api/admin/posts/",
                config.api_url.trim_end_matches('/')
            ))
            .query(&[("limit", "all"), ("formats", "html")])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            let err = resp.text().await.unwrap_or_default();
            return Err(format!("Ghost import error: {}", err));
        }

        let body: GhostPostsResponse = resp.json().await.map_err(|e| e.to_string())?;

        Ok(body
            .posts
            .into_iter()
            .map(|p| ImportedPost {
                id: p.id,
                title: p.title.unwrap_or_else(|| "Untitled".to_string()),
                html_content: p.html.unwrap_or_default(),
                published_at: p.published_at,
                url: p.url,
                platform: "ghost".to_string(),
            })
            .collect())
    }
}
