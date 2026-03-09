#!/usr/bin/env bun
// generate-image.ts — Generate a marketing image via nano-banana-pro and save to workspace
//
// Usage:
//   bun scripts/generate-image.ts \
//     --job-id "camp001_post01" \
//     --ratio "1:1" \
//     --prompt "1:1 aspect ratio. Modern office scene..." \
//     --version "v1"
//
//   # Check brand kit only (no generation):
//   bun scripts/generate-image.ts --check-brand
//
// Environment variables:
//   OPENCLAW_WORKSPACE — workspace root (default: ~/.openclaw/workspace)

import { parseArgs, requireArg, optionalArg, readWorkspaceFile, getImageDir, getToday } from "./lib/workspace.ts";
import { spawnSync } from "child_process";
import { join, existsSync } from "fs";

const args = parseArgs(process.argv);

// ── Check brand mode ─────────────────────────────────────────────────────────
if (args["check-brand"] !== undefined) {
  const brandKit = readWorkspaceFile("brand/brand_kit.md");
  if (!brandKit) {
    console.warn("⚠️  workspace/brand/brand_kit.md not found — proceeding without brand constraints.");
  } else {
    console.log("📄 Brand Kit\n" + "─".repeat(60));
    console.log(brandKit);
  }
  process.exit(0);
}

// ── Generation mode ───────────────────────────────────────────────────────────
const jobId   = requireArg(args, "job-id");
const ratio   = requireArg(args, "ratio");
const prompt  = requireArg(args, "prompt");
const version = optionalArg(args, "version") ?? "v1";

// Validate ratio
const validRatios = ["1:1", "4:5", "9:16", "16:9"];
if (!validRatios.includes(ratio)) {
  console.error(`❌ Invalid ratio: "${ratio}". Valid: ${validRatios.join(", ")}`);
  process.exit(1);
}

// Determine output filename
const ext      = "png";
const filename = `image-${jobId}-${version}.${ext}`;
const imageDir = getImageDir(jobId);
const outPath  = join(imageDir, filename);

console.log(`🎨 Generating image...`);
console.log(`📐 Ratio: ${ratio}`);
console.log(`🆔 Job: ${jobId} (${version})`);
console.log(`📝 Prompt preview: "${prompt.slice(0, 100)}${prompt.length > 100 ? "..." : ""}"`);
console.log(`📁 Output: ${outPath}`);
console.log();

// Call nano-banana-pro (OpenClaw-bundled CLI)
const result = spawnSync(
  "nano-banana-pro",
  ["--prompt", prompt, "--ratio", ratio, "--output", outPath],
  { stdio: "inherit" }
);

if (result.error) {
  console.error("❌ Failed to run nano-banana-pro:", result.error.message);
  if (result.error.message.includes("ENOENT")) {
    console.error("💡 nano-banana-pro not found in PATH.");
    console.error("   Ensure you are running inside the OpenClaw Docker container.");
  }
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`❌ nano-banana-pro exited with code ${result.status}`);
  process.exit(result.status ?? 1);
}

// Verify output file exists
if (!existsSync(outPath)) {
  console.error(`❌ Expected output file not found: ${outPath}`);
  console.error("💡 nano-banana-pro may have saved with a different filename or to a different path.");
  process.exit(1);
}

console.log(`\n✅ Image generated successfully!`);
console.log(`🖼️  File: ${outPath}`);
console.log(`📁 Relative path: assets/images/${getToday()}/${jobId}/${filename}`);
console.log(`\n⚠️  REVIEW GATE: Inspect the image before delivering to requester.`);
console.log(`   Check: text accuracy, no logos/watermarks, correct ratio, no artifacts.`);
console.log(`   If fails: re-run with a simplified prompt and --version v2`);
