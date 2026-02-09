import type { PlatformId } from "@/lib/platforms";

export interface AccountCredential {
  platform: PlatformId;
  accountId: string;
  apiKey: string;
  accountName: string;
  email: string;
}

export interface PublishRequest {
  title: string;
  htmlContent: string;
  subtitle?: string;
  previewText?: string;
  status: "draft" | "published";
}
