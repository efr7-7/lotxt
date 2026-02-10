pub mod beehiiv;
pub mod ghost;
pub mod kit;
pub mod linkedin;
pub mod stripe;
pub mod substack;
pub mod twitter;

use crate::commands::platform::{
    AnalyticsData, Publication, PublishRequest, Subscriber,
};

/// Trait that all newsletter platform services must implement
#[allow(async_fn_in_trait)]
pub trait PlatformService {
    async fn validate_connection(api_key: &str) -> Result<bool, String>;
    async fn get_publications(api_key: &str) -> Result<Vec<Publication>, String>;
    async fn get_subscribers(
        api_key: &str,
        publication_id: Option<&str>,
    ) -> Result<Vec<Subscriber>, String>;
    async fn get_analytics(
        api_key: &str,
        publication_id: Option<&str>,
    ) -> Result<AnalyticsData, String>;
    async fn publish(
        api_key: &str,
        publication_id: &str,
        request: PublishRequest,
    ) -> Result<String, String>;
}
