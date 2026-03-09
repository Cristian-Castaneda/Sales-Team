#!/usr/bin/env bun
// save-bundle.ts — Save validated Meta post bundle to workspace/social/meta/<date>/<job_id>/
//
// Usage:
//   bun scripts/save-bundle.ts \
//     --job-id "camp001_post01" \
//     --platform "instagram" \
//     --format "ig_post" \
//     --caption "Final caption" \
//     --media-path "/path/to/image.jpg" \
//     --hashtags "#fintech #latam"
//
// Environment variables:
//   OPENCLAW_WORKSPACE — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, requireArg, optionalArg, getWorkspaceRoot, getToday } from "./lib/meta-graph.ts";
import { mkdirSync, existsSync, copyFileSync, writeFileSync } from "fs";
import { join, basename } from "path";

const args      = parseArgs(process.argv);
const jobId     = requireArg(args, "job-id");
const platform  = requireArg(args, "platform");
const format    = requireArg(args, "format");
const caption   = requireArg(args, "caption");
const mediaPath = optionalArg(args, "media-path");
const hashtags  = optionalArg(args, "hashtags") ?? "";
const linkUrl   = optionalArg(args, "link-url");

const today      = getToday();
const bundleDir  = join(getWorkspaceRoot(), "social", "meta", today, jobId);

mkdirSync(bundleDir, { recursive: true });
mkdirSync(join(bundleDir, "assets"), { recursive: true });

// Build final caption
const finalCaption = hashtags ? `${caption}\n\n${hashtags}` : caption;
const linkLine     = linkUrl ? `\n🔗 Link: ${linkUrl}` : "";

const validatedCaption = `# Meta Post — Job ${jobId}

**Date:** ${today}
**Platform:** ${platform}
**Format:** ${format}
**Status:** validated, pending approval

## Caption

\`\`\`
${finalCaption}${linkLine}
\`\`\`

## Length

${finalCaption.length} characters
`;

writeFileSync(join(bundleDir, "validated_caption.md"), validatedCaption);
console.log(`✅ Saved validated_caption.md`);

// Copy media asset
let copiedMediaName = "";
if (mediaPath && existsSync(mediaPath)) {
  copiedMediaName = basename(mediaPath);
  copyFileSync(mediaPath, join(bundleDir, "assets", copiedMediaName));
  console.log(`✅ Media copied → assets/${copiedMediaName}`);
}

// Draft result with approval instructions
const approvalInstructions = `# Draft Result — Job ${jobId}

**Status:** 🟡 Local bundle ready — awaiting approval

## What to review

- **Platform:** ${platform}
- **Format:** ${format}
- **Caption preview:** "${finalCaption.slice(0, 200)}${finalCaption.length > 200 ? "..." : ""}"
- **Media:** ${copiedMediaName || "none"}

## To publish

Reply: \`APPROVE ${jobId}\`

Then run (see SKILL.md Workflow Step 3 for exact commands):
- For Instagram: create container → wait → publish
- For Facebook: create post → publish

Workspace: \`workspace/social/meta/${today}/${jobId}/\`
`;

writeFileSync(join(bundleDir, "draft_result.md"), approvalInstructions);
console.log(`✅ Saved draft_result.md`);

console.log(`\n📁 Bundle saved: workspace/social/meta/${today}/${jobId}/`);
console.log(`\n🟡 Awaiting approval — present draft_result.md to user and wait for APPROVE ${jobId}.`);
