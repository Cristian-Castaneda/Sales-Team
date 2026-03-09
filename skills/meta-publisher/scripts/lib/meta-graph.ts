// lib/meta-graph.ts — Meta Graph API helpers for Facebook and Instagram publishing

import { join } from "path";

export type Platform = "facebook" | "instagram";
export type PostFormat =
  | "fb_post" | "fb_reel" | "fb_story"
  | "ig_post" | "ig_reel" | "ig_story" | "ig_carousel";

export type MediaKind = "image" | "video";

export interface ContainerResult {
  containerId: string;
}

export interface PublishResult {
  postId: string;
  postUrl?: string;
}

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

/** Determine media kind from format. */
export function mediaKindFromFormat(format: PostFormat): MediaKind {
  if (format.includes("reel") || format.includes("story")) return "video";
  return "image";
}

/** Get the media type header. */
function mediaContentType(kind: MediaKind, ext: string): string {
  if (kind === "video") return "video/mp4";
  if (ext === "png") return "image/png";
  return "image/jpeg";
}

/** Parse and throw Meta Graph API errors. */
async function assertOk(res: Response, context: string): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    const msg = body?.error?.message ?? res.statusText;
    throw new Error(`${context} failed (${res.status}): ${msg}`);
  }
}

// ─── Instagram ───────────────────────────────────────────────────────────────

/**
 * Create an Instagram media container.
 * For images: returns immediately with a container ID.
 * For videos/reels: container must be polled until status = FINISHED.
 */
export async function createIgContainer(
  token: string,
  igUserId: string,
  format: PostFormat,
  caption: string,
  mediaUrl?: string,
  isCarousel = false
): Promise<ContainerResult> {
  const params: Record<string, string> = {
    access_token: token,
    caption,
  };

  if (format === "ig_reel") {
    params.media_type = "REELS";
    if (mediaUrl) params.video_url = mediaUrl;
  } else if (format === "ig_story") {
    params.media_type = "STORIES";
    if (mediaUrl) params.video_url = mediaUrl;
  } else if (isCarousel) {
    params.is_carousel_item = "true";
    if (mediaUrl) params.image_url = mediaUrl;
  } else {
    // ig_post (image)
    if (mediaUrl) params.image_url = mediaUrl;
  }

  const res = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  await assertOk(res, "IG container creation");
  const data = await res.json();
  return { containerId: data.id };
}

/**
 * Poll IG container status until FINISHED (for videos).
 * Retries up to maxAttempts with a delay between each.
 */
export async function waitForIgContainer(
  token: string,
  containerId: string,
  maxAttempts = 12,
  delayMs = 5000
): Promise<void> {
  for (let i = 1; i <= maxAttempts; i++) {
    const res = await fetch(
      `${GRAPH_BASE}/${containerId}?fields=status_code&access_token=${token}`
    );
    await assertOk(res, "IG container status check");
    const data = await res.json();

    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") {
      throw new Error(`IG container processing failed: ${JSON.stringify(data)}`);
    }

    console.log(`⏳ Container status: ${data.status_code} (attempt ${i}/${maxAttempts})`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("IG container timed out — try publishing manually via Meta Business Suite.");
}

/**
 * Publish a completed IG container.
 */
export async function publishIgContainer(
  token: string,
  igUserId: string,
  containerId: string
): Promise<PublishResult> {
  const res = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  });

  await assertOk(res, "IG publish");
  const data = await res.json();
  return { postId: data.id };
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

/**
 * Create a Facebook Page post (or upload video).
 * Returns the post/object ID.
 */
export async function createFbPost(
  token: string,
  pageId: string,
  format: PostFormat,
  message: string,
  mediaPath?: string,
  linkUrl?: string,
  published = false
): Promise<ContainerResult> {
  if (format === "fb_reel" || format === "fb_story") {
    // Video upload endpoint
    const endpoint = format === "fb_reel"
      ? `${GRAPH_BASE}/${pageId}/video_reels`
      : `${GRAPH_BASE}/${pageId}/stories`;

    const body: Record<string, string> = {
      access_token: token,
      description: message,
      upload_phase: "finish",
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    await assertOk(res, "FB reel/story creation");
    const data = await res.json();
    return { containerId: data.video_id ?? data.id };
  }

  // Standard feed post
  const body: Record<string, string> = {
    access_token: token,
    message,
    published: published ? "true" : "false",
  };

  if (linkUrl) body.link = linkUrl;

  // For image posts, use /photos endpoint
  if (mediaPath) {
    const photosUrl = `${GRAPH_BASE}/${pageId}/photos`;
    const formData = new FormData();
    formData.append("access_token", token);
    formData.append("caption", message);
    formData.append("published", published ? "true" : "false");
    const file = await Bun.file(mediaPath).arrayBuffer();
    const ext  = mediaPath.split(".").pop()?.toLowerCase() ?? "jpg";
    formData.append("source", new Blob([file], { type: mediaContentType("image", ext) }), mediaPath.split("/").pop());

    const res = await fetch(photosUrl, { method: "POST", body: formData });
    await assertOk(res, "FB photo post creation");
    const data = await res.json();
    return { containerId: data.id };
  }

  const res = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await assertOk(res, "FB feed post creation");
  const data = await res.json();
  return { containerId: data.id };
}

/**
 * Publish a previously created (unpublished) FB post.
 */
export async function publishFbPost(
  token: string,
  postId: string
): Promise<PublishResult> {
  const res = await fetch(`${GRAPH_BASE}/${postId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ published: "true", access_token: token }),
  });

  await assertOk(res, "FB publish");
  return { postId };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

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
