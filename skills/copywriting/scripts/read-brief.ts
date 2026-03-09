#!/usr/bin/env bun
// read-brief.ts — Read brand kit, campaign brief, product notes, or ICP from workspace
//
// Usage:
//   bun scripts/read-brief.ts --type brand_kit
//   bun scripts/read-brief.ts --type campaign_brief
//   bun scripts/read-brief.ts --type campaign_brief --campaign-id "camp_abc"
//   bun scripts/read-brief.ts --type product_summary
//   bun scripts/read-brief.ts --type icp
//
// Environment variables:
//   OPENCLAW_WORKSPACE — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, requireArg, optionalArg, readWorkspaceFile, findLatestInWorkspace, getWorkspaceRoot } from "./lib/workspace.ts";
import { existsSync, readdirSync } from "fs";
import { join } from "path";

const args = parseArgs(process.argv);
const type = requireArg(args, "type");
const campaignId = optionalArg(args, "campaign-id");

function printFile(relativePath: string): boolean {
  const content = readWorkspaceFile(relativePath);
  if (!content) return false;
  console.log(`📄 workspace/${relativePath}\n${"─".repeat(60)}`);
  console.log(content);
  return true;
}

function findCampaignBrief(campaignId?: string): string | null {
  const campaignsRoot = join(getWorkspaceRoot(), "marketing", "campaigns");
  if (!existsSync(campaignsRoot)) return null;

  const dates = readdirSync(campaignsRoot)
    .filter((d) => d.match(/^\d{4}-\d{2}-\d{2}$/))
    .sort()
    .reverse();

  for (const date of dates) {
    const datePath = join(campaignsRoot, date);
    let sets: string[];
    try { sets = readdirSync(datePath); } catch { continue; }

    for (const set of sets) {
      if (campaignId && !set.includes(campaignId)) continue;
      const candidate = join(datePath, set, "campaigns.md");
      if (existsSync(candidate)) return `marketing/campaigns/${date}/${set}/campaigns.md`;
    }
  }
  return null;
}

switch (type) {
  case "brand_kit": {
    if (!printFile("brand/brand_kit.md")) {
      console.warn("⚠️  workspace/brand/brand_kit.md not found.");
      console.warn("💡 Create this file with brand voice, tone, colors, and do/don't rules.");
    }
    break;
  }

  case "campaign_brief": {
    const briefPath = findCampaignBrief(campaignId);
    if (!briefPath) {
      console.warn("⚠️  No campaign brief found in workspace/marketing/campaigns/");
      console.warn("💡 Run the marketing-genius skill first to generate campaigns.");
      break;
    }
    printFile(briefPath);
    // Also try to find messaging_house.md in the same folder
    const folder = briefPath.replace("campaigns.md", "");
    printFile(folder + "messaging_house.md");
    break;
  }

  case "product_summary": {
    const found =
      printFile("product/positioning.md") ||
      printFile("product/features.md") ||
      printFile("product/knowledge.md");
    if (!found) {
      console.warn("⚠️  No product summary found in workspace/product/");
      console.warn("💡 Run the product-owner skill to populate product knowledge.");
    }
    break;
  }

  case "icp": {
    if (!printFile("marketing/icp.md")) {
      console.warn("⚠️  workspace/marketing/icp.md not found.");
      console.warn("💡 Run the marketing-genius skill to generate audience insights.");
    }
    break;
  }

  default: {
    console.error(`❌ Unknown type: "${type}"`);
    console.error("   Valid types: brand_kit, campaign_brief, product_summary, icp");
    process.exit(1);
  }
}
