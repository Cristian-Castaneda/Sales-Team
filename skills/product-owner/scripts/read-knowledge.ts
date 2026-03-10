#!/usr/bin/env bun
// read-knowledge.ts — Read product knowledge from skills/product-owner/product-features.md
//
// Usage:
//   bun scripts/read-knowledge.ts                    # print full knowledge file
//   bun scripts/read-knowledge.ts --sections         # list available sections
//   bun scripts/read-knowledge.ts --section Features # print only that section

import { parseArgs, optionalArg } from "./lib/workspace.ts";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const KNOWLEDGE_PATH = join(import.meta.dir, "../product-features.md");
const args = parseArgs(process.argv);
const sectionsOnly = args["sections"] !== undefined;
const sectionFilter = optionalArg(args, "section");

const content = existsSync(KNOWLEDGE_PATH) ? readFileSync(KNOWLEDGE_PATH, "utf-8") : null;
if (!content) {
  console.warn("⚠️  No product knowledge file found at skills/product-owner/product-features.md");
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
  console.log(`📄 Product Knowledge — skills/product-owner/product-features.md\n${"─".repeat(60)}`);
  console.log(content);
}
