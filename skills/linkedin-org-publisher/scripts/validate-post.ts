#!/usr/bin/env bun
// validate-post.ts — Validate LinkedIn Company Page post before publishing
//
// Usage:
//   bun scripts/validate-post.ts \
//     --job-id "camp001_post01" \
//     --text "Post text here" \
//     --type "image" \
//     --media-path "/root/.openclaw/workspace/assets/images/2025-06-01/job001/image-job001-v1.png"
//
//   # Text-only (no media):
//   bun scripts/validate-post.ts --job-id job001 --text "Hello!" --type text_only

import { parseArgs, requireArg, optionalArg } from "./lib/linkedin-org.ts";
import { statSync, existsSync } from "fs";

const args     = parseArgs(process.argv);
const jobId    = requireArg(args, "job-id");
const text     = requireArg(args, "text");
const postType = requireArg(args, "type");
const mediaPath = optionalArg(args, "media-path");

const MAX_TEXT_CHARS = 3000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB

let passed = true;
const issues: string[] = [];
const warnings: string[] = [];

console.log(`🔍 Validating LinkedIn Company Page post — Job ${jobId}`);
console.log("─".repeat(60));

// ── Text validation ───────────────────────────────────────────────────────────
const textLength = text.length;
if (textLength > MAX_TEXT_CHARS) {
  issues.push(`Text too long: ${textLength} chars (max ${MAX_TEXT_CHARS})`);
  passed = false;
} else {
  console.log(`✅ Text length: ${textLength} / ${MAX_TEXT_CHARS} characters`);
}

// Hashtag count check
const hashtags = (text.match(/#\w+/g) ?? []);
if (hashtags.length > 5) {
  warnings.push(`${hashtags.length} hashtags found — consider reducing to ≤ 5 for better reach`);
} else {
  console.log(`✅ Hashtags: ${hashtags.length}`);
}

// Basic spam/policy pattern check
const riskyPatterns = [
  /guaranteed\s+\d+%/i,
  /#1\s+(in|on|at)/i,
  /click here now/i,
  /free money/i,
  /100%\s+(guaranteed|success|accurate)/i,
];
for (const pattern of riskyPatterns) {
  if (pattern.test(text)) {
    warnings.push(`Potential policy-triggering phrase detected: "${text.match(pattern)?.[0]}"`);
  }
}

// ── Media validation ──────────────────────────────────────────────────────────
if (postType !== "text_only") {
  if (!mediaPath) {
    issues.push(`post_type is "${postType}" but --media-path was not provided`);
    passed = false;
  } else if (!existsSync(mediaPath)) {
    issues.push(`Media file not found: ${mediaPath}`);
    passed = false;
  } else {
    const stat = statSync(mediaPath);
    const sizeBytes = stat.size;
    const ext = mediaPath.split(".").pop()?.toLowerCase();

    if (postType === "image") {
      if (!["jpg", "jpeg", "png"].includes(ext ?? "")) {
        issues.push(`Unsupported image format: .${ext} (allowed: jpg, png)`);
        passed = false;
      } else {
        console.log(`✅ Image format: .${ext}`);
      }
      if (sizeBytes > MAX_IMAGE_BYTES) {
        issues.push(`Image too large: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB (max 10MB)`);
        passed = false;
      } else {
        console.log(`✅ Image size: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB`);
      }
    } else if (postType === "video") {
      if (ext !== "mp4") {
        issues.push(`Unsupported video format: .${ext} (allowed: mp4)`);
        passed = false;
      } else {
        console.log(`✅ Video format: .${ext}`);
      }
      if (sizeBytes > MAX_VIDEO_BYTES) {
        issues.push(`Video too large: ${(sizeBytes / 1024 / 1024).toFixed(0)}MB (max 200MB)`);
        passed = false;
      } else {
        console.log(`✅ Video size: ${(sizeBytes / 1024 / 1024).toFixed(0)}MB`);
      }
    }
  }
} else {
  console.log("✅ Post type: text_only (no media required)");
}

// ── Results ───────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(60));

if (warnings.length > 0) {
  console.log("⚠️  Warnings (review before publishing):");
  warnings.forEach((w) => console.log(`   • ${w}`));
  console.log();
}

if (!passed) {
  console.log("❌ Validation FAILED — fix the following before continuing:");
  issues.forEach((i) => console.log(`   • ${i}`));
  process.exit(1);
} else {
  console.log("✅ Validation PASSED — post is ready for the bundle step.");
}
