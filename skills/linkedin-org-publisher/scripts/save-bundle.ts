#!/usr/bin/env bun
// save-bundle.ts — Save validated post bundle to workspace/social/linkedin/<date>/<job_id>/
//
// Usage:
//   bun scripts/save-bundle.ts \
//     --job-id "camp001_post01" \
//     --text "Final post text" \
//     --type "image" \
//     --media-path "/root/.openclaw/workspace/assets/images/2025-06-01/job001/image-job001-v1.png" \
//     --hashtags "#fintech #latam"
//
// Environment variables:
//   OPENCLAW_WORKSPACE — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, requireArg, optionalArg, getWorkspaceRoot, getToday } from "./lib/linkedin-org.ts";
import { mkdirSync, existsSync, copyFileSync, writeFileSync } from "fs";
import { join, basename } from "path";

const args     = parseArgs(process.argv);
const jobId    = requireArg(args, "job-id");
const text     = requireArg(args, "text");
const postType = requireArg(args, "type");
const mediaPath = optionalArg(args, "media-path");
const hashtags  = optionalArg(args, "hashtags") ?? "";
const linkUrl   = optionalArg(args, "link-url");

const today    = getToday();
const bundleDir = join(getWorkspaceRoot(), "social", "linkedin", today, jobId);

mkdirSync(bundleDir, { recursive: true });
mkdirSync(join(bundleDir, "assets"), { recursive: true });

// Save validated_post.md
const finalText = hashtags ? `${text}\n\n${hashtags}` : text;
const linkLine  = linkUrl ? `\n🔗 Link: ${linkUrl}` : "";

const validatedPost = `# LinkedIn Company Page Post — Job ${jobId}

**Date:** ${today}
**Type:** ${postType}
**Status:** validated, pending approval

## Post Text

\`\`\`
${finalText}${linkLine}
\`\`\`

## Characters

${finalText.length} / 3000
`;

writeFileSync(join(bundleDir, "validated_post.md"), validatedPost);
console.log(`✅ Saved validated_post.md`);

// Copy media asset if present
let copiedMediaName = "";
if (mediaPath && existsSync(mediaPath)) {
  copiedMediaName = basename(mediaPath);
  copyFileSync(mediaPath, join(bundleDir, "assets", copiedMediaName));
  console.log(`✅ Media copied → assets/${copiedMediaName}`);
}

// Save draft_result.md with approval instructions
const approvalInstructions = `# Draft Result — Job ${jobId}

**Status:** 🟡 Local bundle ready — awaiting approval

## What to review

${validatedPost}

${copiedMediaName ? `**Media:** assets/${copiedMediaName}` : "**Media:** none (text-only)"}

## To publish

Reply: \`APPROVE ${jobId}\`

Then run:
\`\`\`bash
bun scripts/upload-media.ts --token "$LINKEDIN_ORG_ACCESS_TOKEN" --urn "$LINKEDIN_ORG_URN" --file "<media_path>" --type image
# capture ASSET_URN from output, then:
bun scripts/create-post.ts --token "$LINKEDIN_ORG_ACCESS_TOKEN" --urn "$LINKEDIN_ORG_URN" --job-id "${jobId}" --asset "ASSET_URN"
\`\`\`

For text-only:
\`\`\`bash
bun scripts/create-post.ts --token "$LINKEDIN_ORG_ACCESS_TOKEN" --urn "$LINKEDIN_ORG_URN" --job-id "${jobId}"
\`\`\`
`;

writeFileSync(join(bundleDir, "draft_result.md"), approvalInstructions);
console.log(`✅ Saved draft_result.md`);

console.log(`\n📁 Bundle saved: workspace/social/linkedin/${today}/${jobId}/`);
console.log(`\n🟡 Awaiting approval — present draft_result.md to user and wait for APPROVE ${jobId}.`);
