#!/usr/bin/env bun
// read-inputs.ts — Read product knowledge, brand kit, ICP, or past campaigns from workspace
//
// Usage:
//   bun scripts/read-inputs.ts --type product
//   bun scripts/read-inputs.ts --type brand_kit
//   bun scripts/read-inputs.ts --type icp
//   bun scripts/read-inputs.ts --type past_campaigns
//   bun scripts/read-inputs.ts --type all
//
// Environment variables:
//   OPENCLAW_WORKSPACE — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, requireArg, readWorkspaceFile, findLatestCampaign } from "./lib/workspace.ts";

const args = parseArgs(process.argv);
const type = requireArg(args, "type");

function printFile(relativePath: string, label: string): boolean {
  const content = readWorkspaceFile(relativePath);
  if (!content) return false;
  console.log(`\n📄 ${label} — workspace/${relativePath}\n${"─".repeat(60)}`);
  console.log(content);
  return true;
}

function readProduct(): boolean {
  return (
    printFile("product/knowledge.md", "Product Knowledge") ||
    printFile("product/positioning.md", "Product Positioning") ||
    printFile("product/features.md", "Product Features")
  );
}

function readBrandKit(): boolean {
  return printFile("brand/brand_kit.md", "Brand Kit");
}

function readIcp(): boolean {
  return printFile("marketing/icp.md", "ICP / Audience");
}

function readPastCampaigns(): boolean {
  const path = findLatestCampaign();
  if (!path) return false;
  return printFile(path, "Latest Campaign");
}

switch (type) {
  case "product": {
    if (!readProduct()) {
      console.warn("⚠️  No product files found in workspace/product/");
      console.warn("💡 Run the product-owner skill to populate product knowledge.");
    }
    break;
  }
  case "brand_kit": {
    if (!readBrandKit()) {
      console.warn("⚠️  workspace/brand/brand_kit.md not found.");
      console.warn("💡 Create this file with brand voice, colors, and do/don't rules.");
    }
    break;
  }
  case "icp": {
    if (!readIcp()) {
      console.warn("⚠️  workspace/marketing/icp.md not found — will define audience from prompt context.");
    }
    break;
  }
  case "past_campaigns": {
    if (!readPastCampaigns()) {
      console.warn("⚠️  No past campaigns found — starting fresh.");
    }
    break;
  }
  case "all": {
    readProduct();
    readBrandKit();
    readIcp();
    readPastCampaigns();
    break;
  }
  default: {
    console.error(`❌ Unknown type: "${type}"`);
    console.error("   Valid types: product, brand_kit, icp, past_campaigns, all");
    process.exit(1);
  }
}
