#!/usr/bin/env bun
// publish-post.ts — Publish a Meta container/post after explicit user approval
// ⚠️  ONLY run this after APPROVE <job_id> is received from the user
//
// Usage:
//   # Instagram:
//   bun scripts/publish-post.ts \
//     --token "$META_ACCESS_TOKEN" \
//     --ig-user-id "$IG_USER_ID" \
//     --container-id "17XXXXXXXXXXXXXXXXX" \
//     --platform instagram \
//     --job-id "camp001_post01"
//
//   # Facebook:
//   bun scripts/publish-post.ts \
//     --token "$META_ACCESS_TOKEN" \
//     --page-id "$FB_PAGE_ID" \
//     --container-id "12345678" \
//     --platform facebook \
//     --job-id "camp001_post01"
//
// Environment variables:
//   META_ACCESS_TOKEN — Page Access Token
//   FB_PAGE_ID        — Facebook Page numeric ID
//   IG_USER_ID        — Instagram Business User ID

import {
  parseArgs, requireArg, optionalArg,
  waitForIgContainer, publishIgContainer,
  publishFbPost,
  getWorkspaceRoot, getToday,
  type Platform,
} from "./lib/meta-graph.ts";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const args        = parseArgs(process.argv);
const token       = requireArg(args, "token", "META_ACCESS_TOKEN");
const jobId       = requireArg(args, "job-id");
const platform    = requireArg(args, "platform") as Platform;
const containerId = requireArg(args, "container-id");
const igUserId    = optionalArg(args, "ig-user-id", "IG_USER_ID");
const pageId      = optionalArg(args, "page-id", "FB_PAGE_ID");

if (platform === "instagram" && !igUserId) {
  console.error("❌ --ig-user-id is required for Instagram (or set $IG_USER_ID)");
  process.exit(1);
}

if (platform === "facebook" && !pageId) {
  console.error("❌ --page-id is required for Facebook (or set $FB_PAGE_ID)");
  process.exit(1);
}

async function run(): Promise<void> {
  console.log(`🚀 Publishing ${platform} post — Job ${jobId}`);
  console.log(`📦 Container ID: ${containerId}`);

  let postId: string;
  let postUrl: string | undefined;

  if (platform === "instagram") {
    // Wait for IG container to finish processing (important for videos)
    console.log("⏳ Waiting for container to be ready (up to 60s for videos)...");
    await waitForIgContainer(token, containerId);

    console.log("📤 Publishing container...");
    const result = await publishIgContainer(token, igUserId!, containerId);
    postId  = result.postId;
    postUrl = `https://www.instagram.com/p/${postId}/`;

  } else {
    // Facebook: mark the unpublished post as published
    console.log("📤 Publishing Facebook post...");
    const result = await publishFbPost(token, containerId);
    postId  = result.postId;
    postUrl = `https://www.facebook.com/${postId}`;
  }

  console.log(`\n✅ Published successfully!`);
  console.log(`🔗 Post URL: ${postUrl ?? `ID: ${postId}`}`);

  // Update draft_result.md
  const today      = getToday();
  const bundleDir  = join(getWorkspaceRoot(), "social", "meta", today, jobId);
  const resultPath = join(bundleDir, "draft_result.md");
  const publishLog = `\n\n---\n## Publish Result\n\n✅ Published at ${new Date().toISOString()}\nPlatform: ${platform}\nPost ID: ${postId}\n🔗 ${postUrl ?? "N/A"}\n`;

  if (existsSync(resultPath)) {
    const existing = readFileSync(resultPath, "utf-8");
    writeFileSync(resultPath, existing + publishLog);
  }
}

run().catch((err) => {
  console.error("❌ Publish failed:", err.message);

  if (err.message.includes("190") || err.message.includes("OAuthException")) {
    console.error("💡 Token expired — regenerate your Page Access Token");
    console.error("   See references/setup-guide.md");
  } else if (err.message.includes("10") || err.message.includes("permission")) {
    console.error("💡 Permission denied — ensure instagram_content_publish and pages_manage_posts are granted");
  } else if (err.message.includes("timed out")) {
    console.error("💡 Container processing timed out — try publishing manually via Meta Business Suite");
    console.error(`   Container ID: ${containerId}`);
  } else if (err.message.includes("368")) {
    console.error("💡 Content may violate Meta policies — review caption and media for policy issues");
  }

  process.exit(1);
});
