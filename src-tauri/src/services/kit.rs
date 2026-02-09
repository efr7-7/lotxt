use reqwest::Client;
use serde::Deserialize;

use crate::commands::platform::{
    AnalyticsData, GrowthPoint, PostPerformance, Publication, PublishRequest, Subscriber,
};
use crate::services::PlatformService;

const BASE_URL: &str = "https://api.convertkit.com/v4";

pub struct KitService;

// ─── Kit (ConvertKit) API v4 response types ─────────────────────

#[derive(Deserialize)]
struct KitPaginatedResponse<T> {
    data: Option<Vec<T>>,
    subscribers: Option<Vec<T>>,
    broadcasts: Option<Vec<T>>,
}

#[derive(Deserialize)]
struct KitAccount {
    name: Option<String>,
    primary_email_address: Option<String>,
}

#[derive(Deserialize)]
struct KitSubscriber {
    id: u64,
    email_address: String,
    state: String,
    created_at: Option<String>,
}

#[derive(Deserialize)]
struct KitBroadcast {
    id: u64,
    subject: Option<String>,
    created_at: Option<String>,
    stats: Option<KitBroadcastStats>,
}

#[derive(Deserialize)]
struct KitBroadcastStats {
    recipients: Option<u64>,
    open_rate: Option<f64>,
    click_rate: Option<f64>,
    unsubscribes: Option<u64>,
    total_clicks: Option<u64>,
    open_count: Option<u64>,
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

impl PlatformService for KitService {
    async fn validate_connection(api_key: &str) -> Result<bool, String> {
        let c = client(api_key)?;
        let resp = c
            .get(format!("{}/account", BASE_URL))
            .send()
            .await
            .map_err(|e| e.to_string())?;
        Ok(resp.status().is_success())
    }

    async fn get_publications(api_key: &str) -> Result<Vec<Publication>, String> {
        let c = client(api_key)?;
        let resp = c
            .get(format!("{}/account", BASE_URL))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err(format!("Kit API error: {}", resp.status()));
        }

        let account: KitAccount = resp.json().await.map_err(|e| e.to_string())?;

        // Kit doesn't have separate "publications" — the account itself is the publication
        Ok(vec![Publication {
            id: "default".to_string(),
            name: account.name.unwrap_or_else(|| "Kit Account".to_string()),
            url: "https://app.convertkit.com".to_string(),
            platform: "kit".to_string(),
            subscriber_count: None,
            description: account.primary_email_address,
        }])
    }

    async fn get_subscribers(
        api_key: &str,
        _publication_id: Option<&str>,
    ) -> Result<Vec<Subscriber>, String> {
        let c = client(api_key)?;
        let resp = c
            .get(format!("{}/subscribers", BASE_URL))
            .query(&[("per_page", "100")])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err(format!("Kit API error: {}", resp.status()));
        }

        let body: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
        let subscribers: Vec<KitSubscriber> = serde_json::from_value(
            body.get("subscribers")
                .cloned()
                .unwrap_or(serde_json::Value::Array(vec![])),
        )
        .map_err(|e| e.to_string())?;

        Ok(subscribers
            .into_iter()
            .map(|s| Subscriber {
                id: s.id.to_string(),
                email: s.email_address,
                status: s.state,
                created_at: s.created_at.unwrap_or_default(),
                platform: "kit".to_string(),
            })
            .collect())
    }

    async fn get_analytics(
        api_key: &str,
        _publication_id: Option<&str>,
    ) -> Result<AnalyticsData, String> {
        let c = client(api_key)?;

        // Get subscriber count
        let subs_resp = c
            .get(format!("{}/subscribers", BASE_URL))
            .query(&[("per_page", "1")])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let total_subscribers: u64 = if subs_resp.status().is_success() {
            let body: serde_json::Value = subs_resp.json().await.map_err(|e| e.to_string())?;
            body.get("total_subscribers")
                .or_else(|| body.get("total_count"))
                .and_then(|v| v.as_u64())
                .unwrap_or(0)
        } else {
            0
        };

        // Get broadcasts for post performance
        let bc_resp = c
            .get(format!("{}/broadcasts", BASE_URL))
            .query(&[("per_page", "50")])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let mut recent_posts = Vec::new();
        let mut total_open_rate = 0.0;
        let mut total_click_rate = 0.0;
        let mut counted = 0u64;

        if bc_resp.status().is_success() {
            let body: serde_json::Value = bc_resp.json().await.map_err(|e| e.to_string())?;
            let broadcasts: Vec<KitBroadcast> = serde_json::from_value(
                body.get("broadcasts")
                    .cloned()
                    .unwrap_or(serde_json::Value::Array(vec![])),
            )
            .unwrap_or_default();

            for bc in &broadcasts {
                if let Some(stats) = &bc.stats {
                    total_open_rate += stats.open_rate.unwrap_or(0.0);
                    total_click_rate += stats.click_rate.unwrap_or(0.0);
                    counted += 1;

                    recent_posts.push(PostPerformance {
                        id: bc.id.to_string(),
                        title: bc.subject.clone().unwrap_or_else(|| "Untitled".to_string()),
                        published_at: bc.created_at.clone().unwrap_or_default(),
                        opens: stats.open_count.unwrap_or(0),
                        clicks: stats.total_clicks.unwrap_or(0),
                        unsubscribes: stats.unsubscribes.unwrap_or(0),
                        platform: "kit".to_string(),
                    });
                }
            }
        }

        let avg_open_rate = if counted > 0 {
            total_open_rate / counted as f64
        } else {
            0.0
        };
        let avg_click_rate = if counted > 0 {
            total_click_rate / counted as f64
        } else {
            0.0
        };

        Ok(AnalyticsData {
            total_subscribers,
            open_rate: avg_open_rate,
            click_rate: avg_click_rate,
            subscriber_growth: vec![],
            recent_posts,
        })
    }

    async fn publish(
        api_key: &str,
        _publication_id: &str,
        request: PublishRequest,
    ) -> Result<String, String> {
        let c = client(api_key)?;

        let body = serde_json::json!({
            "broadcast": {
                "subject": request.title,
                "content": request.html_content,
                "preview_text": request.preview_text.unwrap_or_default(),
                "public": request.status == "published",
            }
        });

        let resp = c
            .post(format!("{}/broadcasts", BASE_URL))
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            let err_text = resp.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Kit publish error: {}", err_text));
        }

        let result: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
        let id = result
            .get("broadcast")
            .and_then(|b| b.get("id"))
            .and_then(|id| id.as_u64())
            .map(|id| id.to_string())
            .unwrap_or_else(|| "unknown".to_string());

        Ok(id)
    }
}
