#!/usr/bin/env bun
// save-campaign.ts — Save campaign artifacts to workspace/marketing/campaigns/<date>/<campaign_id>/
//
// Usage:
//   bun scripts/save-campaign.ts \
//     --campaign-id "camp001" \
//     --file "campaigns.md" \
//     --content "# Campaign Set..."
//
//   # Pipe from stdin:
//   cat campaigns.md | bun scripts/save-campaign.ts --campaign-id camp001 --file campaigns.md
//
// Environment variables:
//   OPENCLAW_WORKSPACE — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, requireArg, optionalArg, writeWorkspaceFile, generateCampaignId, getToday } from "./lib/workspace.ts";
import { readFileSync } from "fs";

const args       = parseArgs(process.argv);
const campaignId = optionalArg(args, "campaign-id") ?? generateCampaignId();
const file       = requireArg(args, "file");

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
const relativePath = `marketing/campaigns/${today}/${campaignId}/${file}`;
const savedPath    = writeWorkspaceFile(relativePath, content);

console.log(`✅ Saved → ${savedPath}`);
console.log(`📁 Workspace: marketing/campaigns/${today}/${campaignId}/${file}`);
console.log(`🆔 Campaign ID: ${campaignId}`);
