#!/usr/bin/env bun
// generate-image.ts — Generate a marketing image and save to workspace
//
// Usage:
//   bun scripts/generate-image.ts \
//     --job-id "camp001_post01" \
//     --ratio "1:1" \
//     --prompt "1:1 aspect ratio. Modern office scene..." \
//     --version "v1" \
//     [--provider anthropic|nano-banana]
//
// Providers:
//   anthropic    — Claude generates HTML, Chromium renders it to PNG (default)
//   nano-banana  — Uses nano-banana-pro CLI (OpenClaw bundled)
//
// Both providers save to the same output path so the review gate and write-notes
// steps work identically regardless of provider.
//
// The anthropic provider also saves the source HTML alongside the PNG so you
// can inspect or tweak it for a v2 iteration.
//
// Environment variables:
//   ANTHROPIC_API_KEY   — required for anthropic provider
//   BROWSER_URL         — Chromium/Browserless URL (default: http://browser:3000)
//   OPENCLAW_WORKSPACE  — workspace root (default: ~/.openclaw/workspace)

import {
  parseArgs,
  requireArg,
  optionalArg,
  readWorkspaceFile,
  getImageDir,
  getToday,
} from "./lib/workspace.ts";
import { spawnSync } from "child_process";
import { join } from "path";
import { existsSync, writeFileSync } from "fs";

const args = parseArgs(process.argv);

// ── Check brand mode ──────────────────────────────────────────────────────────
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
const jobId    = requireArg(args, "job-id");
const ratio    = requireArg(args, "ratio");
const prompt   = requireArg(args, "prompt");
const version  = optionalArg(args, "version") ?? "v1";
const provider = optionalArg(args, "provider") ?? "anthropic";

// Validate ratio
const validRatios = ["1:1", "4:5", "9:16", "16:9"];
if (!validRatios.includes(ratio)) {
  console.error(`❌ Invalid ratio: "${ratio}". Valid: ${validRatios.join(", ")}`);
  process.exit(1);
}

// Validate provider
if (!["anthropic", "nano-banana"].includes(provider)) {
  console.error(`❌ Invalid provider: "${provider}". Valid: anthropic, nano-banana`);
  process.exit(1);
}

// Determine output paths
const filename = `image-${jobId}-${version}.png`;
const imageDir = getImageDir(jobId);
const outPath  = join(imageDir, filename);
const htmlPath = join(imageDir, `image-${jobId}-${version}.html`);

console.log(`🎨 Generating image...`);
console.log(`🔌 Provider: ${provider}`);
console.log(`📐 Ratio: ${ratio}`);
console.log(`🆔 Job: ${jobId} (${version})`);
console.log(`📝 Prompt preview: "${prompt.slice(0, 100)}${prompt.length > 100 ? "..." : ""}"`);
console.log(`📁 Output: ${outPath}`);
console.log();

// ─────────────────────────────────────────────────────────────────────────────
// Provider: anthropic — Claude generates HTML → Chromium renders PNG
// ─────────────────────────────────────────────────────────────────────────────
if (provider === "anthropic") {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY is not set. Add it to your .env file.");
    process.exit(1);
  }

  const { generateHtmlForImage, renderHtmlToImage } = await import("./lib/anthropic-image.ts");

  const brandKit = readWorkspaceFile("brand/brand_kit.md");

  let html: string;
  try {
    html = await generateHtmlForImage(prompt, ratio, brandKit);
  } catch (err) {
    console.error("❌ Claude HTML generation failed:", (err as Error).message);
    process.exit(1);
  }

  // Save HTML so you can inspect / tweak before rendering again
  writeFileSync(htmlPath, html, "utf-8");
  console.log(`📄 HTML saved: ${htmlPath}`);

  try {
    await renderHtmlToImage(html, ratio, outPath);
  } catch (err) {
    console.error("❌ Chromium rendering failed:", (err as Error).message);
    console.error("💡 Is the browser service running? Check BROWSER_URL or docker-compose.");
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider: nano-banana — OpenClaw-bundled nano-banana-pro CLI
// ─────────────────────────────────────────────────────────────────────────────
else if (provider === "nano-banana") {
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify output
// ─────────────────────────────────────────────────────────────────────────────
if (!existsSync(outPath)) {
  console.error(`❌ Expected output file not found: ${outPath}`);
  process.exit(1);
}

console.log(`\n✅ Image generated successfully!`);
console.log(`🖼️  File: ${outPath}`);
if (provider === "anthropic") {
  console.log(`📄 HTML: ${htmlPath}`);
}
console.log(`📁 Relative path: assets/images/${getToday()}/${jobId}/${filename}`);
console.log(`\n⚠️  REVIEW GATE: Inspect the image before delivering to requester.`);
console.log(`   Check: text accuracy, no logos/watermarks, correct ratio, no artifacts.`);
console.log(`   If fails: re-run with a simplified prompt and --version v2`);
console.log(`   For anthropic provider: you can also edit the HTML file and re-render.`);
