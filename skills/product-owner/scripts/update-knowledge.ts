#!/usr/bin/env bun
// update-knowledge.ts — Update product knowledge with versioning and changelog
//
// Usage:
//   # Initialize empty knowledge file:
//   bun scripts/update-knowledge.ts --init
//
//   # Add/update a section:
//   bun scripts/update-knowledge.ts \
//     --section "Features" \
//     --content "#### Feature: Multi-level Approvals\n- What it does: ..." \
//     --change-note "Added multi-level approvals feature"
//
//   # Replace the entire section:
//   bun scripts/update-knowledge.ts \
//     --section "Differentiators" \
//     --content "- Differentiator 1: ..." \
//     --change-note "Updated differentiators" \
//     --replace
//
// Environment variables:
//   OPENCLAW_WORKSPACE — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, optionalArg, readWorkspaceFile, writeWorkspaceFile, getToday, bumpPatch } from "./lib/workspace.ts";
import { readFileSync } from "fs";

const KNOWLEDGE_PATH = "product/knowledge.md";
const args = parseArgs(process.argv);

const isInit     = args["init"] !== undefined;
const section    = optionalArg(args, "section");
const changeNote = optionalArg(args, "change-note");
const doReplace  = args["replace"] !== undefined;

// Content from --content or stdin
let newContent = optionalArg(args, "content");
if (!newContent && !isInit) {
  try {
    const stdin = readFileSync("/dev/stdin", "utf-8").trim();
    if (stdin) newContent = stdin;
  } catch {
    // no stdin
  }
}

// ── INIT ─────────────────────────────────────────────────────────────────────
if (isInit) {
  const existing = readWorkspaceFile(KNOWLEDGE_PATH);
  if (existing) {
    console.log("ℹ️  Knowledge file already exists — use --section to update specific sections.");
    process.exit(0);
  }

  const template = `---
version: 0.1.0
product: Expense-360
last_updated: ${getToday()}
---

# Product Knowledge — Expense-360

## Product Summary
<!-- Add a one-liner description of what Expense-360 is -->

## ICP (Ideal Customer Profile)
<!-- Region, roles, company size, main use cases -->

## Features
<!-- Add features using the format:
#### Feature: <name>
- What it does:
- Who uses it:
- Why it matters:
-->

## Differentiators
<!-- Why Expense-360 over alternatives -->

## Benefits
<!-- Features → outcomes (no invented numbers) -->

## Objections
<!-- Common objections + safe responses -->

## Comparisons
<!-- Only documented competitor info -->

## FAQ

## Changelog
- 0.1.0 (${getToday()}): Initial knowledge file created.
`;

  const savedPath = writeWorkspaceFile(KNOWLEDGE_PATH, template);
  console.log(`✅ Knowledge file initialized: ${savedPath}`);
  console.log("💡 Next: fill in the sections using --section updates.");
  process.exit(0);
}

// ── UPDATE ────────────────────────────────────────────────────────────────────
if (!section) {
  console.error("❌ --section is required for updates.");
  console.error("   Run with --init to create the file first.");
  process.exit(1);
}

if (!newContent) {
  console.error("❌ No content provided. Use --content 'text' or pipe via stdin.");
  process.exit(1);
}

if (!changeNote) {
  console.error("❌ --change-note is required (one-line description of the change).");
  process.exit(1);
}

let file = readWorkspaceFile(KNOWLEDGE_PATH);
if (!file) {
  console.error("❌ Knowledge file not found. Run --init first.");
  process.exit(1);
}

// Extract current version from frontmatter
const versionMatch = file.match(/^version:\s*([\d.]+)/m);
const currentVersion = versionMatch ? versionMatch[1] : "0.0.0";
const newVersion = bumpPatch(currentVersion);

// Update version in frontmatter
file = file.replace(/^version:\s*[\d.]+/m, `version: ${newVersion}`);
file = file.replace(/^last_updated:\s*.+/m, `last_updated: ${getToday()}`);

// Find section boundary
const sectionHeader = `## ${section}`;
const sectionIdx = file.indexOf(sectionHeader);

if (sectionIdx === -1) {
  // Section doesn't exist — append before Changelog
  const changelogIdx = file.indexOf("## Changelog");
  const insertBefore = changelogIdx !== -1 ? changelogIdx : file.length;
  const newSection = `## ${section}\n${newContent}\n\n`;
  file = file.slice(0, insertBefore) + newSection + file.slice(insertBefore);
  console.log(`📝 Section "## ${section}" created (did not exist).`);
} else {
  // Find end of this section (next ## heading or end of file)
  const afterSection = file.indexOf("\n## ", sectionIdx + sectionHeader.length);
  const sectionEnd = afterSection !== -1 ? afterSection : file.length;

  if (doReplace) {
    // Replace entire section content
    file = file.slice(0, sectionIdx) + `${sectionHeader}\n${newContent}\n` + file.slice(sectionEnd);
    console.log(`♻️  Section "## ${section}" replaced.`);
  } else {
    // Append to section (before next ##)
    const appendPoint = sectionEnd;
    file = file.slice(0, appendPoint) + `\n${newContent}` + file.slice(appendPoint);
    console.log(`➕ Content appended to "## ${section}".`);
  }
}

// Append changelog entry
const changelogEntry = `- ${newVersion} (${getToday()}): ${changeNote}`;
file = file.replace(/(## Changelog\n)/, `$1${changelogEntry}\n`);

const savedPath = writeWorkspaceFile(KNOWLEDGE_PATH, file);

console.log(`\n✅ Knowledge updated → ${savedPath}`);
console.log(`📦 Version: ${currentVersion} → ${newVersion}`);
console.log(`📝 Change: ${changeNote}`);
