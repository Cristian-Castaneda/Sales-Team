#!/usr/bin/env bun
// save-draft.ts — Save generated copy to workspace/copy/<date>/<job_id>/
//
// Usage:
//   bun scripts/save-draft.ts \
//     --job-id "abc123" \
//     --type "linkedin_post" \
//     --file "draft.md" \
//     --content "The copy content here"
//
//   # Pipe from stdin (useful for multiline content):
//   echo "content" | bun scripts/save-draft.ts --job-id abc123 --type tagline --file draft.md
//
// Environment variables:
//   OPENCLAW_WORKSPACE — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, requireArg, optionalArg, writeWorkspaceFile, generateJobId, getToday } from "./lib/workspace.ts";
import { readFileSync } from "fs";

const args = parseArgs(process.argv);
const jobId = optionalArg(args, "job-id") ?? generateJobId();
const type  = requireArg(args, "type");
const file  = requireArg(args, "file");

// Content from --content flag or stdin
let content = optionalArg(args, "content");
if (!content) {
  try {
    const stdin = readFileSync("/dev/stdin", "utf-8").trim();
    if (stdin) content = stdin;
  } catch {
    // stdin not available
  }
}

if (!content) {
  console.error("❌ No content to save. Use --content 'text' or pipe content via stdin.");
  process.exit(1);
}

const today        = getToday();
const relativePath = `copy/${today}/${jobId}/${file}`;
const savedPath    = writeWorkspaceFile(relativePath, content);

console.log(`✅ Saved ${type} → ${savedPath}`);
console.log(`📁 Workspace path: copy/${today}/${jobId}/${file}`);
console.log(`🆔 Job ID: ${jobId}`);
