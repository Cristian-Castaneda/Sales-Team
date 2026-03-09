#!/usr/bin/env bun
// create-container.ts — Create a Meta media container or unpublished post (approval step)
// ⚠️  Only run this after explicit user approval (APPROVE <job_id>)
//
// Usage:
//   # Instagram image/reel/story:
//   bun scripts/create-container.ts \
//     --token "$META_ACCESS_TOKEN" \
//     --ig-user-id "$IG_USER_ID" \
//     --job-id "camp001_post01" \
//     --format "ig_reel" \
//     --media-path "/path/to/video.mp4"
//
//   # Facebook feed post:
//   bun scripts/create-container.ts \
//     --token "$META_ACCESS_TOKEN" \
//     --page-id "$FB_PAGE_ID" \
//     --job-id "camp001_post01" \
//     --format "fb_post" \
//     --media-path "/path/to/image.jpg"
//
// Environment variables:
//   META_ACCESS_TOKEN — Page Access Token
//   FB_PAGE_ID        — Facebook Page numeric ID
//   IG_USER_ID        — Instagram Business User ID

import {
  parseArgs, requireArg, optionalArg,
  createIgContainer, createFbPost,
  getWorkspaceRoot, getToday,
  type PostFormat,
} from "./lib/meta-graph.ts";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const args      = parseArgs(process.argv);
const token     = requireArg(args, "token", "META_ACCESS_TOKEN");
const jobId     = requireArg(args, "job-id");
const format    = requireArg(args, "format") as PostFormat;
const mediaPath = optionalArg(args, "media-path");
const igUserId  = optionalArg(args, "ig-user-id", "IG_USER_ID");
const pageId    = optionalArg(args, "page-id", "FB_PAGE_ID");
const linkUrl   = optionalArg(args, "link-url");

// Determine platform from format
const isInstagram = format.startsWith("ig_");
const isFacebook  = format.startsWith("fb_");

if (isInstagram && !igUserId) {
  console.error("❌ --ig-user-id is required for Instagram formats (or set $IG_USER_ID)");
  process.exit(1);
}
if (isFacebook && !pageId) {
  console.error("❌ --page-id is required for Facebook formats (or set $FB_PAGE_ID)");
  process.exit(1);
}

// Read caption from saved bundle
const today     = getToday();
const bundleDir = join(getWorkspaceRoot(), "social", "meta", today, jobId);
const captionMd = join(bundleDir, "validated_caption.md");

if (!existsSync(captionMd)) {
  console.error(`❌ Bundle not found: ${captionMd}`);
  console.error("   Run save-bundle.ts first.");
  process.exit(1);
}

const raw   = readFileSync(captionMd, "utf-8");
const match = raw.match(/```\n([\s\S]+?)\n```/);
if (!match) {
  console.error("❌ Could not parse caption from validated_caption.md");
  process.exit(1);
}
const caption = match[1].trim();

async function run(): Promise<void> {
  console.log(`📦 Creating ${format} container — Job ${jobId}`);
  console.log(`💬 Caption preview: "${caption.slice(0, 100)}..."`);
  if (mediaPath) console.log(`📁 Media: ${mediaPath}`);

  let containerId: string;

  if (isInstagram) {
    // For IG, media must be a public URL. If it's a local path, note that limitation.
    if (mediaPath && !mediaPath.startsWith("http")) {
      console.warn("⚠️  Instagram container creation requires a public media URL.");
      console.warn("   Local file paths are not supported directly by the Graph API.");
      console.warn("   Upload the file to a public URL first (CDN, signed URL, etc.).");
      console.warn("   Proceeding with path as-is — this may fail.");
    }

    const result = await createIgContainer(
      token,
      igUserId!,
      format,
      caption,
      mediaPath
    );
    containerId = result.containerId;
  } else {
    const result = await createFbPost(
      token,
      pageId!,
      format,
      caption,
      mediaPath,
      linkUrl,
      false // unpublished — needs approval to publish
    );
    containerId = result.containerId;
  }

  console.log(`\n✅ Container created!`);
  console.log(`CONTAINER_ID=${containerId}`);
  console.log(`\n💡 Copy the CONTAINER_ID above and pass it to publish-post.ts`);

  // Append container ID to draft_result.md
  const resultPath = join(bundleDir, "draft_result.md");
  const containerLog = `\n\n---\n## Container Created\n\nCONTAINER_ID: \`${containerId}\`\nFormat: ${format}\nCreated at: ${new Date().toISOString()}\n\nNext: run publish-post.ts with --container-id ${containerId}\n`;
  if (existsSync(resultPath)) {
    const existing = readFileSync(resultPath, "utf-8");
    writeFileSync(resultPath, existing + containerLog);
  }
}

run().catch((err) => {
  console.error("❌ Container creation failed:", err.message);

  if (err.message.includes("190") || err.message.includes("OAuthException")) {
    console.error("💡 Token expired or invalid — regenerate your Page Access Token");
    console.error("   See references/setup-guide.md");
  } else if (err.message.includes("10") || err.message.includes("permission")) {
    console.error("💡 Missing permissions — ensure pages_manage_posts and instagram_content_publish are granted");
  } else if (err.message.includes("100")) {
    console.error("💡 Invalid parameter — check Page ID and IG User ID");
  }

  process.exit(1);
});
