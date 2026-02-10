#[allow(dead_code)]
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct StripeCharge {
    pub id: String,
    pub amount: i64,
    pub currency: String,
    pub status: String,
    pub created: i64,
    pub description: Option<String>,
    pub receipt_email: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct StripeSubscription {
    pub id: String,
    pub status: String,
    pub current_period_start: i64,
    pub current_period_end: i64,
    pub plan: Option<StripePlan>,
    pub customer: String,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct StripePlan {
    pub amount: Option<i64>,
    pub currency: Option<String>,
    pub interval: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct StripeList<T> {
    data: Vec<T>,
    has_more: bool,
}

#[allow(dead_code)]
pub struct StripeService;

#[allow(dead_code)]
impl StripeService {
    pub async fn fetch_charges(api_key: &str, limit: u32) -> Result<Vec<StripeCharge>, String> {
        let client = reqwest::Client::new();
        let resp = client
            .get(format!(
                "https://api.stripe.com/v1/charges?limit={}",
                limit.min(100)
            ))
            .basic_auth(api_key, Option::<&str>::None)
            .send()
            .await
            .map_err(|e| format!("Stripe API error: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Stripe API {} - {}", status, body));
        }

        let list: StripeList<StripeCharge> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse Stripe response: {}", e))?;

        Ok(list.data)
    }

    pub async fn fetch_subscriptions(
        api_key: &str,
        limit: u32,
    ) -> Result<Vec<StripeSubscription>, String> {
        let client = reqwest::Client::new();
        let resp = client
            .get(format!(
                "https://api.stripe.com/v1/subscriptions?limit={}&status=active",
                limit.min(100)
            ))
            .basic_auth(api_key, Option::<&str>::None)
            .send()
            .await
            .map_err(|e| format!("Stripe API error: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Stripe API {} - {}", status, body));
        }

        let list: StripeList<StripeSubscription> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse Stripe response: {}", e))?;

        Ok(list.data)
    }
}
