use reqwest::Client;
use serde::Deserialize;

use crate::commands::platform::{
    AnalyticsData, ImportedPost, PostPerformance, Publication, PublishRequest, Subscriber,
};
use crate::services::PlatformService;

const BASE_URL: &str = "https://api.beehiiv.com/v2";

pub struct BeehiivService;

// ─── Beehiiv API response types ─────────────────────────────────

#[derive(Deserialize)]
struct BeehiivListResponse<T> {
    data: Vec<T>,
}

#[derive(Deserialize)]
struct BeehiivPublication {
    id: String,
    name: String,
    url: Option<String>,
    #[serde(default)]
    description: Option<String>,
}

#[derive(Deserialize)]
struct BeehiivSubscription {
    id: String,
    email: String,
    status: String,
    created: Option<i64>,
}

#[derive(Deserialize)]
struct BeehiivPost {
    id: String,
    title: Option<String>,
    publish_date: Option<i64>,
    stats: Option<BeehiivPostStats>,
    #[allow(dead_code)]
    status: Option<String>,
    content_html: Option<String>,
    web_url: Option<String>,
}

#[derive(Deserialize)]
struct BeehiivPostStats {
    email_open_count: Option<u64>,
    email_click_count: Option<u64>,
    unsubscribe_count: Option<u64>,
}

#[derive(Deserialize)]
struct BeehiivSingleResponse<T> {
    data: T,
}

fn client(api_key: &str) -> Result<Client, String> {
    Client::builder()
        .default_headers({
            let mut h = reqwest::header::HeaderMap::new();
            h.insert(
                reqwest::header::AUTHORIZATION,
                format!("Bearer {}", api_key).parse().unwrap(),
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

impl PlatformService for BeehiivService {
    async fn validate_connection(api_key: &str) -> Result<bool, String> {
        let c = client(api_key)?;
        let resp = c
            .get(format!("{}/publications", BASE_URL))
            .send()
            .await
            .map_err(|e| e.to_string())?;
        Ok(resp.status().is_success())
    }

    async fn get_publications(api_key: &str) -> Result<Vec<Publication>, String> {
        let c = client(api_key)?;
        let resp = c
            .get(format!("{}/publications", BASE_URL))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err(format!("Beehiiv API error: {}", resp.status()));
        }

        let body: BeehiivListResponse<BeehiivPublication> =
            resp.json().await.map_err(|e| e.to_string())?;

        Ok(body
            .data
            .into_iter()
            .map(|p| Publication {
                id: p.id,
                name: p.name,
                url: p.url.unwrap_or_default(),
                platform: "beehiiv".to_string(),
                subscriber_count: None,
                description: p.description,
            })
            .collect())
    }

    async fn get_subscribers(
        api_key: &str,
        publication_id: Option<&str>,
    ) -> Result<Vec<Subscriber>, String> {
        let pub_id = publication_id.ok_or("Publication ID required for Beehiiv")?;
        let c = client(api_key)?;
        let resp = c
            .get(format!(
                "{}/publications/{}/subscriptions",
                BASE_URL, pub_id
            ))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err(format!("Beehiiv API error: {}", resp.status()));
        }

        let body: BeehiivListResponse<BeehiivSubscription> =
            resp.json().await.map_err(|e| e.to_string())?;

        Ok(body
            .data
            .into_iter()
            .map(|s| Subscriber {
                id: s.id,
                email: s.email,
                status: s.status,
                created_at: s
                    .created
                    .map(|t| {
                        chrono::DateTime::from_timestamp(t, 0)
                            .map(|dt| dt.format("%Y-%m-%d").to_string())
                            .unwrap_or_default()
                    })
                    .unwrap_or_default(),
                platform: "beehiiv".to_string(),
            })
            .collect())
    }

    async fn get_analytics(
        api_key: &str,
        publication_id: Option<&str>,
    ) -> Result<AnalyticsData, String> {
        let pub_id = publication_id.ok_or("Publication ID required for Beehiiv")?;
        let c = client(api_key)?;

        // Fetch posts for analytics
        let posts_resp = c
            .get(format!("{}/publications/{}/posts", BASE_URL, pub_id))
            .query(&[("status", "confirmed"), ("limit", "50")])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let posts_data: BeehiivListResponse<BeehiivPost> = if posts_resp.status().is_success() {
            posts_resp.json().await.map_err(|e| e.to_string())?
        } else {
            BeehiivListResponse { data: vec![] }
        };

        // Fetch subscriber count
        let subs_resp = c
            .get(format!(
                "{}/publications/{}/subscriptions",
                BASE_URL, pub_id
            ))
            .query(&[("limit", "1")])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let total_subscribers: u64 = if subs_resp.status().is_success() {
            // Beehiiv returns total_count in the response
            let body: serde_json::Value = subs_resp.json().await.map_err(|e| e.to_string())?;
            body.get("total_results")
                .and_then(|v| v.as_u64())
                .unwrap_or(0)
        } else {
            0
        };

        let mut total_opens: u64 = 0;
        let mut total_clicks: u64 = 0;
        let mut post_count: u64 = 0;
        let mut recent_posts = Vec::new();

        for post in &posts_data.data {
            if let Some(stats) = &post.stats {
                let opens = stats.email_open_count.unwrap_or(0);
                let clicks = stats.email_click_count.unwrap_or(0);
                let unsubs = stats.unsubscribe_count.unwrap_or(0);

                total_opens += opens;
                total_clicks += clicks;
                post_count += 1;

                recent_posts.push(PostPerformance {
                    id: post.id.clone(),
                    title: post.title.clone().unwrap_or_else(|| "Untitled".to_string()),
                    published_at: post
                        .publish_date
                        .map(|t| {
                            chrono::DateTime::from_timestamp(t, 0)
                                .map(|dt| dt.format("%Y-%m-%d").to_string())
                                .unwrap_or_default()
                        })
                        .unwrap_or_default(),
                    opens,
                    clicks,
                    unsubscribes: unsubs,
                    platform: "beehiiv".to_string(),
                });
            }
        }

        let open_rate = if post_count > 0 && total_subscribers > 0 {
            (total_opens as f64 / (total_subscribers as f64 * post_count as f64)) * 100.0
        } else {
            0.0
        };

        let click_rate = if total_opens > 0 {
            (total_clicks as f64 / total_opens as f64) * 100.0
        } else {
            0.0
        };

        Ok(AnalyticsData {
            total_subscribers,
            open_rate,
            click_rate,
            subscriber_growth: vec![], // Beehiiv doesn't provide historical growth in basic API
            recent_posts,
        })
    }

    async fn publish(
        api_key: &str,
        publication_id: &str,
        request: PublishRequest,
    ) -> Result<String, String> {
        let c = client(api_key)?;

        let body = serde_json::json!({
            "content_html": request.html_content,
            "title": request.title,
            "subtitle": request.subtitle.unwrap_or_default(),
            "preview_text": request.preview_text.unwrap_or_default(),
            "status": request.status,
        });

        let resp = c
            .post(format!(
                "{}/publications/{}/posts",
                BASE_URL, publication_id
            ))
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            let err_text = resp.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Beehiiv publish error: {}", err_text));
        }

        let result: BeehiivSingleResponse<BeehiivPost> =
            resp.json().await.map_err(|e| e.to_string())?;
        Ok(result.data.id)
    }
}

// ─── Import (standalone, not on trait) ──────────────────────────

impl BeehiivService {
    pub async fn import_posts(
        api_key: &str,
        publication_id: Option<&str>,
    ) -> Result<Vec<ImportedPost>, String> {
        let pub_id = publication_id.ok_or("Publication ID required for Beehiiv import")?;
        let c = client(api_key)?;

        let resp = c
            .get(format!("{}/publications/{}/posts", BASE_URL, pub_id))
            .query(&[("status", "confirmed"), ("limit", "50"), ("expand", "free_web_content")])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err(format!("Beehiiv import error: {}", resp.status()));
        }

        let body: BeehiivListResponse<BeehiivPost> =
            resp.json().await.map_err(|e| e.to_string())?;

        Ok(body
            .data
            .into_iter()
            .map(|p| ImportedPost {
                id: p.id,
                title: p.title.unwrap_or_else(|| "Untitled".to_string()),
                html_content: p.content_html.unwrap_or_default(),
                published_at: p.publish_date.map(|t| {
                    chrono::DateTime::from_timestamp(t, 0)
                        .map(|dt| dt.format("%Y-%m-%dT%H:%M:%SZ").to_string())
                        .unwrap_or_default()
                }),
                url: p.web_url,
                platform: "beehiiv".to_string(),
            })
            .collect())
    }
}
