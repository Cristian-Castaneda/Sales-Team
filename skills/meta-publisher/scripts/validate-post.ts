#!/usr/bin/env bun
// validate-post.ts — Validate Meta (Facebook/Instagram) post before publishing
//
// Usage:
//   bun scripts/validate-post.ts \
//     --job-id "camp001_post01" \
//     --platform "instagram" \
//     --format "ig_reel" \
//     --caption "Caption text here" \
//     --media-path "/root/.openclaw/workspace/assets/videos/2025-06-01/job001/video-job001-v1.mp4"
//
//   # Text-only Facebook post:
//   bun scripts/validate-post.ts --job-id job001 --platform facebook --format fb_post --caption "Hello!"

import { parseArgs, requireArg, optionalArg, type PostFormat } from "./lib/meta-graph.ts";
import { statSync, existsSync } from "fs";

const args      = parseArgs(process.argv);
const jobId     = requireArg(args, "job-id");
const platform  = requireArg(args, "platform");
const format    = requireArg(args, "format") as PostFormat;
const caption   = requireArg(args, "caption");
const mediaPath = optionalArg(args, "media-path");

// Platform-specific limits
const MAX_CAPTION_IG = 2200;
const MAX_CAPTION_FB = 63206;
const MAX_HASHTAGS_IG = 30;
const MAX_HASHTAGS_FB = 10;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;   // 8 MB (IG limit)
const MAX_VIDEO_BYTES = 1024 * 1024 * 1024; // 1 GB

// Formats that require media
const MEDIA_REQUIRED: PostFormat[] = ["fb_reel", "fb_story", "ig_post", "ig_reel", "ig_story", "ig_carousel"];

let passed = true;
const issues: string[] = [];
const warnings: string[] = [];

console.log(`🔍 Validating Meta post — Job ${jobId}`);
console.log(`📱 Platform: ${platform} | Format: ${format}`);
console.log("─".repeat(60));

// ── Caption validation ────────────────────────────────────────────────────────
const maxCaption = platform === "instagram" ? MAX_CAPTION_IG : MAX_CAPTION_FB;
if (caption.length > maxCaption) {
  issues.push(`Caption too long: ${caption.length} chars (max ${maxCaption} for ${platform})`);
  passed = false;
} else {
  console.log(`✅ Caption length: ${caption.length} / ${maxCaption} chars`);
}

const hashtags = caption.match(/#\w+/g) ?? [];
const maxHashtags = platform === "instagram" ? MAX_HASHTAGS_IG : MAX_HASHTAGS_FB;
if (hashtags.length > maxHashtags) {
  warnings.push(`${hashtags.length} hashtags — ${platform} allows up to ${maxHashtags}`);
} else {
  console.log(`✅ Hashtags: ${hashtags.length}`);
}

// Basic policy pattern check
const riskyPatterns = [
  { pattern: /guaranteed\s+\d+%/i, label: "guaranteed % claim" },
  { pattern: /100%\s+(free|safe|secure|guaranteed)/i, label: "absolute guarantee" },
  { pattern: /click here now/i, label: "spam-like CTA" },
  { pattern: /make \$\d+ (fast|quick|easy)/i, label: "money-making claim" },
];
for (const { pattern, label } of riskyPatterns) {
  if (pattern.test(caption)) {
    warnings.push(`Potential policy issue: ${label}`);
  }
}

// ── Media validation ──────────────────────────────────────────────────────────
const needsMedia = MEDIA_REQUIRED.includes(format);

if (needsMedia) {
  if (!mediaPath) {
    issues.push(`Format "${format}" requires media but --media-path was not provided`);
    passed = false;
  } else if (!existsSync(mediaPath)) {
    issues.push(`Media file not found: ${mediaPath}`);
    passed = false;
  } else {
    const stat = statSync(mediaPath);
    const sizeBytes = stat.size;
    const ext = mediaPath.split(".").pop()?.toLowerCase() ?? "";

    const isVideo = format.includes("reel") || format.includes("story");
    const isImage = !isVideo;

    if (isImage) {
      if (!["jpg", "jpeg", "png"].includes(ext)) {
        issues.push(`Unsupported image format: .${ext} (allowed: jpg, png)`);
        passed = false;
      } else {
        console.log(`✅ Image format: .${ext}`);
      }
      if (sizeBytes > MAX_IMAGE_BYTES) {
        issues.push(`Image too large: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB (max 8MB for Instagram)`);
        passed = false;
      } else {
        console.log(`✅ Image size: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB`);
      }
    } else {
      if (ext !== "mp4") {
        issues.push(`Unsupported video format: .${ext} (required: mp4)`);
        passed = false;
      } else {
        console.log(`✅ Video format: .${ext}`);
      }
      if (sizeBytes > MAX_VIDEO_BYTES) {
        issues.push(`Video too large: ${(sizeBytes / 1024 / 1024 / 1024).toFixed(2)}GB (max 1GB)`);
        passed = false;
      } else {
        console.log(`✅ Video size: ${(sizeBytes / 1024 / 1024).toFixed(0)}MB`);
      }
    }
  }
} else {
  console.log(`✅ Media: optional for format "${format}"`);
}

// ── Results ───────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(60));

if (warnings.length > 0) {
  console.log("⚠️  Warnings:");
  warnings.forEach((w) => console.log(`   • ${w}`));
  console.log();
}

if (!passed) {
  console.log("❌ Validation FAILED — fix the following before continuing:");
  issues.forEach((i) => console.log(`   • ${i}`));
  process.exit(1);
} else {
  console.log("✅ Validation PASSED — proceed to save-bundle.ts");
}
