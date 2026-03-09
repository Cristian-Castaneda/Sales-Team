#!/usr/bin/env bun
// create-post.ts — Publish a LinkedIn Company Page post (text, image, or video)
// ⚠️  ONLY run this after explicit user approval (APPROVE <job_id>)
//
// Usage:
//   # Text-only
//   bun scripts/create-post.ts \
//     --token "$LINKEDIN_ORG_ACCESS_TOKEN" \
//     --urn "$LINKEDIN_ORG_URN" \
//     --job-id "camp001_post01"
//
//   # With image or video (asset URN from upload-media.ts)
//   bun scripts/create-post.ts \
//     --token "$LINKEDIN_ORG_ACCESS_TOKEN" \
//     --urn "$LINKEDIN_ORG_URN" \
//     --job-id "camp001_post01" \
//     --asset "urn:li:digitalmediaAsset:XXXXX" \
//     --asset-type image
//
// Environment variables:
//   LINKEDIN_ORG_ACCESS_TOKEN — OAuth token with w_organization_social scope
//   LINKEDIN_ORG_URN          — urn:li:organization:XXXXXXXX
//   OPENCLAW_WORKSPACE        — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, requireArg, optionalArg, createOrgPost, getWorkspaceRoot, getToday, type MediaType } from "./lib/linkedin-org.ts";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

const args      = parseArgs(process.argv);
const token     = requireArg(args, "token", "LINKEDIN_ORG_ACCESS_TOKEN");
const orgUrn    = requireArg(args, "urn", "LINKEDIN_ORG_URN");
const jobId     = requireArg(args, "job-id");
const assetUrn  = optionalArg(args, "asset");
const assetType = (optionalArg(args, "asset-type") ?? "image") as MediaType;

// Read post text from bundle
const today      = getToday();
const bundleDir  = join(getWorkspaceRoot(), "social", "linkedin", today, jobId);
const postMdPath = join(bundleDir, "validated_post.md");

if (!existsSync(postMdPath)) {
  console.error(`❌ Bundle not found: ${postMdPath}`);
  console.error(`   Run save-bundle.ts first.`);
  process.exit(1);
}

// Extract post text from validated_post.md (between ``` blocks)
const raw  = readFileSync(postMdPath, "utf-8");
const match = raw.match(/```\n([\s\S]+?)\n```/);
if (!match) {
  console.error("❌ Could not parse post text from validated_post.md");
  console.error("   Expected a ``` code block containing the post text.");
  process.exit(1);
}

const postText = match[1].trim();
const MAX_CHARS = 3000;

if (postText.length > MAX_CHARS) {
  console.error(`❌ Post text too long: ${postText.length} chars (max ${MAX_CHARS})`);
  process.exit(1);
}

async function run(): Promise<void> {
  const postTypeLabel = assetUrn ? `${assetType} post` : "text-only post";
  console.log(`📝 Publishing LinkedIn Company Page ${postTypeLabel}...`);
  console.log(`🏢 Org URN: ${orgUrn}`);
  console.log(`📄 Text preview: "${postText.slice(0, 80)}${postText.length > 80 ? "..." : ""}"`);
  if (assetUrn) console.log(`🖼️  Asset URN: ${assetUrn}`);

  const { postUrn, postUrl } = await createOrgPost(
    { token, orgUrn },
    postText,
    assetUrn,
    assetUrn ? assetType : undefined
  );

  console.log(`\n✅ Published successfully!`);
  console.log(`🔗 Post URL: ${postUrl}`);
  console.log(`🆔 Post URN: ${postUrn}`);

  if (assetUrn && assetType === "video") {
    console.log(`\n⏳ Video processing: LinkedIn may take 2–10 min to process the video.`);
    console.log(`   The post is live but the video thumbnail will appear shortly.`);
  }

  // Update draft_result.md with publish confirmation
  const resultPath = join(bundleDir, "draft_result.md");
  const publishLog = `\n\n---\n## Publish Result\n\n✅ Published at ${new Date().toISOString()}\n🔗 ${postUrl}\n🆔 ${postUrn}\n`;
  if (existsSync(resultPath)) {
    const existing = readFileSync(resultPath, "utf-8");
    writeFileSync(resultPath, existing + publishLog);
  }
}

run().catch((err) => {
  console.error("❌ Publish failed:", err.message);

  if (err.message.includes("401")) {
    console.error("💡 Token expired — generate a new one (see references/setup-guide.md)");
  } else if (err.message.includes("403")) {
    console.error("💡 Missing scope — ensure w_organization_social is granted");
    console.error("   Also verify the token owner has admin access to the organization page");
  } else if (err.message.includes("422")) {
    console.error("💡 Check org URN format: urn:li:organization:XXXXXXXX");
  } else if (err.message.includes("429")) {
    console.error("💡 Rate limited — wait a few minutes and retry");
  }

  process.exit(1);
});
