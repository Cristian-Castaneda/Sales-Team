// lib/linkedin-org.ts — LinkedIn Organization Page API helpers and types

import { join } from "path";

export interface OrgConfig {
  token: string;
  orgUrn: string; // urn:li:organization:XXXXXXXX
}

export type MediaType = "image" | "video";

export interface UploadRegistration {
  uploadUrl: string;
  assetUrn: string;
}

export interface PostResult {
  postUrn: string;
  postUrl: string;
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

const BASE_URL = "https://api.linkedin.com/v2";

export function linkedInHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

/**
 * Register a media upload for an organization.
 * Requires w_organization_social scope.
 */
export async function registerOrgUpload(
  config: OrgConfig,
  mediaType: MediaType
): Promise<UploadRegistration> {
  const recipe =
    mediaType === "image"
      ? "urn:li:digitalmediaRecipe:feedshare-image"
      : "urn:li:digitalmediaRecipe:feedshare-video";

  const body = {
    registerUploadRequest: {
      recipes: [recipe],
      owner: config.orgUrn,
      serviceRelationships: [
        {
          relationshipType: "OWNER",
          identifier: "urn:li:userGeneratedContent",
        },
      ],
    },
  };

  const res = await fetch(`${BASE_URL}/assets?action=registerUpload`, {
    method: "POST",
    headers: linkedInHeaders(config.token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Register upload failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const uploadUrl =
    data.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;
  const assetUrn = data.value.asset;

  return { uploadUrl, assetUrn };
}

/** Upload raw file bytes to LinkedIn's upload URL. */
export async function uploadFileBytes(
  uploadUrl: string,
  filePath: string,
  mediaType: MediaType
): Promise<void> {
  const fileData = await Bun.file(filePath).arrayBuffer();
  const contentType = mediaType === "image" ? "image/jpeg" : "video/mp4";

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: fileData,
  });

  if (res.status !== 200 && res.status !== 201) {
    const text = await res.text();
    throw new Error(`File upload failed (${res.status}): ${text}`);
  }
}

/**
 * Create an organic UGC post on behalf of an organization.
 * Requires w_organization_social scope.
 */
export async function createOrgPost(
  config: OrgConfig,
  text: string,
  assetUrn?: string,
  mediaType?: MediaType
): Promise<PostResult> {
  let shareMediaCategory = "NONE";
  if (assetUrn && mediaType === "image") shareMediaCategory = "IMAGE";
  if (assetUrn && mediaType === "video") shareMediaCategory = "VIDEO";

  const shareContent: Record<string, unknown> = {
    shareCommentary: { text },
    shareMediaCategory,
  };

  if (assetUrn) {
    shareContent.media = [{ status: "READY", media: assetUrn }];
  }

  const body = {
    author: config.orgUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": shareContent,
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch(`${BASE_URL}/ugcPosts`, {
    method: "POST",
    headers: linkedInHeaders(config.token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create post failed (${res.status}): ${text}`);
  }

  const postUrn = res.headers.get("x-restli-id") ?? "";
  // For org posts, URL format is the same as personal
  const postUrl = `https://www.linkedin.com/feed/update/${postUrn}/`;

  return { postUrn, postUrl };
}

/** Parse CLI args into a simple key→value map. */
export function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith("--") && argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

/** Require a CLI arg or env var; exit with error if missing. */
export function requireArg(
  args: Record<string, string>,
  key: string,
  envKey?: string
): string {
  const value = args[key] ?? (envKey ? process.env[envKey] : undefined);
  if (!value) {
    console.error(`❌ Missing required argument: --${key}${envKey ? ` (or env $${envKey})` : ""}`);
    process.exit(1);
  }
  return value;
}

/** Optionally read a CLI arg or env var. */
export function optionalArg(
  args: Record<string, string>,
  key: string,
  envKey?: string
): string | undefined {
  return args[key] ?? (envKey ? process.env[envKey] : undefined);
}

/** Get workspace root. */
export function getWorkspaceRoot(): string {
  return process.env.OPENCLAW_WORKSPACE ?? join(process.env.HOME ?? "/root", ".openclaw", "workspace");
}

/** Return today as YYYY-MM-DD. */
export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}
