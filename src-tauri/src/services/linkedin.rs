use serde::Deserialize;

pub struct LinkedinService;

#[derive(Deserialize)]
struct LinkedinUserInfo {
    sub: String,
}

impl LinkedinService {
    pub async fn validate(api_key: &str) -> Result<bool, String> {
        let client = reqwest::Client::new();
        let resp = client
            .get("https://api.linkedin.com/v2/userinfo")
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        Ok(resp.status().is_success())
    }

    async fn get_person_urn(api_key: &str) -> Result<String, String> {
        let client = reqwest::Client::new();
        let resp = client
            .get("https://api.linkedin.com/v2/userinfo")
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err(format!("LinkedIn API error: {}", resp.status()));
        }

        let info: LinkedinUserInfo = resp.json().await.map_err(|e| e.to_string())?;
        Ok(format!("urn:li:person:{}", info.sub))
    }

    pub async fn post(
        api_key: &str,
        content: &str,
        article_url: Option<&str>,
    ) -> Result<String, String> {
        let author = Self::get_person_urn(api_key).await?;

        let mut share_content = serde_json::json!({
            "shareCommentary": {
                "text": content
            },
            "shareMediaCategory": "NONE"
        });

        // If article URL provided, attach it
        if let Some(url) = article_url {
            share_content["shareMediaCategory"] = serde_json::json!("ARTICLE");
            share_content["media"] = serde_json::json!([{
                "status": "READY",
                "originalUrl": url
            }]);
        }

        let body = serde_json::json!({
            "author": author,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": share_content
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        });

        let client = reqwest::Client::new();
        let resp = client
            .post("https://api.linkedin.com/v2/ugcPosts")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .header("X-Restli-Protocol-Version", "2.0.0")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("LinkedIn post failed: {}", e))?;

        if !resp.status().is_success() {
            let err = resp.text().await.unwrap_or_default();
            return Err(format!("LinkedIn API error: {}", err));
        }

        // LinkedIn returns the post ID in the x-restli-id header or response body
        let post_id = resp
            .headers()
            .get("x-restli-id")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("posted")
            .to_string();

        Ok(post_id)
    }
}
