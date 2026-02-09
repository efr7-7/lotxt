export type PlatformId = "beehiiv" | "substack" | "kit";

export interface PlatformDef {
  id: PlatformId;
  name: string;
  color: string;
  icon: string; // Lucide icon name or emoji fallback
  description: string;
  apiDocsUrl: string;
  hasOfficialApi: boolean;
  authType: "api_key" | "session_cookie" | "oauth";
  fields: { key: string; label: string; placeholder: string; type: "text" | "password" | "textarea" }[];
}

export const PLATFORMS: PlatformDef[] = [
  {
    id: "beehiiv",
    name: "Beehiiv",
    color: "#FF6719",
    icon: "hexagon",
    description: "Scale your newsletter with Beehiiv's growth tools",
    apiDocsUrl: "https://developers.beehiiv.com",
    hasOfficialApi: true,
    authType: "api_key",
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
    description: "Publish to Substack (unofficial integration — limited features)",
    apiDocsUrl: "https://substack.com",
    hasOfficialApi: false,
    authType: "session_cookie",
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
    fields: [
      { key: "api_key", label: "API Key", placeholder: "Your Kit API key (v4)", type: "password" },
      { key: "account_name", label: "Account Name", placeholder: "My Kit Account", type: "text" },
      { key: "email", label: "Account Email", placeholder: "you@example.com", type: "text" },
    ],
  },
];

export function getPlatform(id: PlatformId): PlatformDef | undefined {
  return PLATFORMS.find((p) => p.id === id);
}
