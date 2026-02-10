export type PlatformId = "beehiiv" | "substack" | "kit" | "twitter" | "linkedin" | "ghost";

export type PlatformCategory = "newsletter" | "social";

export interface PlatformDef {
  id: PlatformId;
  name: string;
  color: string;
  icon: string;
  description: string;
  apiDocsUrl: string;
  hasOfficialApi: boolean;
  authType: "api_key" | "session_cookie" | "oauth" | "bearer_token";
  category: PlatformCategory;
  fields: { key: string; label: string; placeholder: string; type: "text" | "password" | "textarea" }[];
}

export const PLATFORMS: PlatformDef[] = [
  // Newsletter platforms
  {
    id: "beehiiv",
    name: "Beehiiv",
    color: "#FF6719",
    icon: "hexagon",
    description: "Scale your newsletter with Beehiiv's growth tools",
    apiDocsUrl: "https://developers.beehiiv.com",
    hasOfficialApi: true,
    authType: "api_key",
    category: "newsletter",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "Your Beehiiv API key", type: "password" },
      { key: "account_name", label: "Publication Name", placeholder: "My Newsletter", type: "text" },
      { key: "email", label: "Account Email", placeholder: "you@example.com", type: "text" },
    ],
  },
  {
    id: "substack",
    name: "Substack",
    color: "#FF6719",
    icon: "book-open",
    description: "Publish to Substack (unofficial integration)",
    apiDocsUrl: "https://substack.com",
    hasOfficialApi: false,
    authType: "session_cookie",
    category: "newsletter",
    fields: [
      { key: "subdomain", label: "Subdomain", placeholder: "yournewsletter (from yournewsletter.substack.com)", type: "text" },
      { key: "cookie", label: "Session Cookie (optional)", placeholder: "substack.sid=...", type: "textarea" },
      { key: "account_name", label: "Publication Name", placeholder: "My Substack", type: "text" },
      { key: "email", label: "Account Email", placeholder: "you@example.com", type: "text" },
    ],
  },
  {
    id: "kit",
    name: "Kit",
    color: "#FB6970",
    icon: "mail",
    description: "Connect to Kit (formerly ConvertKit) for email marketing",
    apiDocsUrl: "https://developers.convertkit.com",
    hasOfficialApi: true,
    authType: "api_key",
    category: "newsletter",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "Your Kit API key (v4)", type: "password" },
      { key: "account_name", label: "Account Name", placeholder: "My Kit Account", type: "text" },
      { key: "email", label: "Account Email", placeholder: "you@example.com", type: "text" },
    ],
  },
  {
    id: "ghost",
    name: "Ghost",
    color: "#15171A",
    icon: "ghost",
    description: "Publish to Ghost — open-source publishing platform",
    apiDocsUrl: "https://ghost.org/docs/admin-api/",
    hasOfficialApi: true,
    authType: "api_key",
    category: "newsletter",
    fields: [
      { key: "api_key", label: "Admin API Key", placeholder: "Your Ghost Admin API key", type: "password" },
      { key: "api_url", label: "Site URL", placeholder: "https://yoursite.ghost.io", type: "text" },
      { key: "account_name", label: "Publication Name", placeholder: "My Ghost Blog", type: "text" },
      { key: "email", label: "Account Email", placeholder: "you@example.com", type: "text" },
    ],
  },
  // Social platforms
  {
    id: "twitter",
    name: "Twitter / X",
    color: "#000000",
    icon: "twitter",
    description: "Share posts and threads to Twitter/X",
    apiDocsUrl: "https://developer.twitter.com/en/docs",
    hasOfficialApi: true,
    authType: "bearer_token",
    category: "social",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "Your Twitter API Key", type: "password" },
      { key: "api_secret", label: "API Secret", placeholder: "Your Twitter API Secret", type: "password" },
      { key: "access_token", label: "Access Token", placeholder: "Your access token", type: "password" },
      { key: "access_secret", label: "Access Token Secret", placeholder: "Your access token secret", type: "password" },
      { key: "account_name", label: "Handle", placeholder: "@yourhandle", type: "text" },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    icon: "linkedin",
    description: "Share articles and posts to LinkedIn",
    apiDocsUrl: "https://learn.microsoft.com/en-us/linkedin/",
    hasOfficialApi: true,
    authType: "bearer_token",
    category: "social",
    fields: [
      { key: "api_key", label: "Access Token", placeholder: "Your LinkedIn access token", type: "password" },
      { key: "account_name", label: "Profile Name", placeholder: "Your Name", type: "text" },
      { key: "email", label: "Account Email", placeholder: "you@example.com", type: "text" },
    ],
  },
];

export const NEWSLETTER_PLATFORMS = PLATFORMS.filter((p) => p.category === "newsletter");
export const SOCIAL_PLATFORMS = PLATFORMS.filter((p) => p.category === "social");

export function getPlatform(id: PlatformId): PlatformDef | undefined {
  return PLATFORMS.find((p) => p.id === id);
}
