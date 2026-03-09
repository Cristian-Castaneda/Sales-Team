#!/usr/bin/env bun
// write-notes.ts — Write notes.md for a completed image generation job
//
// Usage:
//   bun scripts/write-notes.ts \
//     --job-id "camp001_post01" \
//     --ad-type "native" \
//     --ratio "1:1" \
//     --prompt "Final prompt used..." \
//     --selected "image-camp001_post01-v1.png" \
//     --review-notes "Gate passed. Text matches. No logos." \
//     --caption-ideas "Optional caption idea 1 | Optional caption idea 2"
//
// Environment variables:
//   OPENCLAW_WORKSPACE — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, requireArg, optionalArg, writeWorkspaceFile, getToday } from "./lib/workspace.ts";

const args = parseArgs(process.argv);

const jobId        = requireArg(args, "job-id");
const adType       = requireArg(args, "ad-type");
const ratio        = requireArg(args, "ratio");
const prompt       = requireArg(args, "prompt");
const selected     = requireArg(args, "selected");
const reviewNotes  = optionalArg(args, "review-notes") ?? "Gate passed.";
const captionIdeas = optionalArg(args, "caption-ideas");

const today = getToday();

const captionSection = captionIdeas
  ? `\n## Caption Ideas\n${captionIdeas.split("|").map((c) => `- ${c.trim()}`).join("\n")}`
  : "";

const notes = `# Image Builder Notes — Job ${jobId}

**Date:** ${today}
**Ad Type:** ${adType}
**Aspect Ratio:** ${ratio}
**Selected File:** ${selected}

## Prompt Used

\`\`\`
${prompt}
\`\`\`

## Review Gate Results

${reviewNotes}

## File Paths

- Image: \`workspace/assets/images/${today}/${jobId}/${selected}\`
- Notes: \`workspace/assets/images/${today}/${jobId}/notes.md\`
${captionSection}
`;

const relativePath = `assets/images/${today}/${jobId}/notes.md`;
const savedPath    = writeWorkspaceFile(relativePath, notes);

console.log(`✅ Notes saved → ${savedPath}`);
console.log(`📁 Workspace path: ${relativePath}`);
