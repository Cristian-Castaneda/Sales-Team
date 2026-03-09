#!/usr/bin/env bun
// read-knowledge.ts — Read product knowledge from workspace/product/knowledge.md
//
// Usage:
//   bun scripts/read-knowledge.ts                    # print full knowledge file
//   bun scripts/read-knowledge.ts --sections         # list available sections
//   bun scripts/read-knowledge.ts --section Features # print only that section
//
// Environment variables:
//   OPENCLAW_WORKSPACE — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, optionalArg, readWorkspaceFile } from "./lib/workspace.ts";

const KNOWLEDGE_PATH = "product/knowledge.md";
const args = parseArgs(process.argv);
const sectionsOnly = args["sections"] !== undefined;
const sectionFilter = optionalArg(args, "section");

const content = readWorkspaceFile(KNOWLEDGE_PATH);
if (!content) {
  console.warn("⚠️  No product knowledge file found at workspace/product/knowledge.md");
  console.warn("💡 Run: bun scripts/update-knowledge.ts --init");
  console.warn("   Then add product facts using: bun scripts/update-knowledge.ts --section Features ...");
  process.exit(0);
}

// Parse sections (lines starting with "## ")
const lines = content.split("\n");
const sections: string[] = [];
let currentSection = "";
const sectionContent: Record<string, string[]> = {};

for (const line of lines) {
  if (line.startsWith("## ")) {
    currentSection = line.slice(3).trim();
    sections.push(currentSection);
    sectionContent[currentSection] = [line];
  } else if (currentSection) {
    sectionContent[currentSection].push(line);
  }
}

if (sectionsOnly) {
  console.log("📋 Available sections in product knowledge:");
  sections.forEach((s) => console.log(`   • ${s}`));
  process.exit(0);
}

if (sectionFilter) {
  const match = sections.find((s) => s.toLowerCase() === sectionFilter.toLowerCase());
  if (!match) {
    console.error(`❌ Section not found: "${sectionFilter}"`);
    console.error(`   Available: ${sections.join(", ")}`);
    process.exit(1);
  }
  console.log(`📄 Section: ${match}\n${"─".repeat(60)}`);
  console.log(sectionContent[match].join("\n"));
} else {
  console.log(`📄 Product Knowledge — workspace/${KNOWLEDGE_PATH}\n${"─".repeat(60)}`);
  console.log(content);
}
