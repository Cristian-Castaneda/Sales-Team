// lib/anthropic-image.ts — Generate marketing images via Claude (HTML) + Chromium rendering
//
// Flow:
//   1. Call Claude (claude-opus-4-6) with the image brief
//   2. Claude returns a complete, self-contained HTML page designed at exact pixel dimensions
//   3. POST the HTML to the Browserless Chromium service for a screenshot → PNG
//
// Environment variables:
//   ANTHROPIC_API_KEY — required
//   BROWSER_URL       — Chromium/Browserless URL (default: http://browser:3000)

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

const BROWSER_URL = process.env.BROWSER_URL ?? "http://browser:3000";

export const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1":  { width: 1080, height: 1080 },
  "4:5":  { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

const HTML_SYSTEM_PROMPT = `You are an expert HTML/CSS designer specialising in high-impact marketing visuals.

Given a marketing image brief, generate a single, self-contained HTML file that, when rendered at the specified pixel dimensions, produces a professional marketing image suitable for ads and social media.

Strict rules:
- Output ONLY the complete HTML document. No explanations, no markdown fences, no preamble.
- Use inline CSS only. No external stylesheets, no Google Fonts CDN requests.
  If custom fonts are needed, embed a simple system-font stack (e.g. -apple-system, Helvetica Neue, Arial).
- The <html> and <body> elements must have exactly:
    width: {WIDTH}px; height: {HEIGHT}px; margin: 0; padding: 0; overflow: hidden;
- Make it visually striking: bold gradients or solid backgrounds, strong typography, clear hierarchy.
- Text must appear exactly as specified in the brief — no additions, no omissions, no paraphrasing.
- NO logos, NO brand marks, NO watermarks unless the brief explicitly includes them.
- The design must look correct at 1× scale without scrolling (it will be screenshot at exact dimensions).`;

/**
 * Ask Claude to generate an HTML document representing the marketing image.
 * Returns the raw HTML string.
 */
export async function generateHtmlForImage(
  prompt: string,
  ratio: string,
  brandKit: string | null
): Promise<string> {
  const dims = RATIO_DIMENSIONS[ratio];
  if (!dims) throw new Error(`Unknown ratio: ${ratio}`);

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = HTML_SYSTEM_PROMPT
    .replace("{WIDTH}", String(dims.width))
    .replace("{HEIGHT}", String(dims.height));

  const userContent = [
    `Canvas: ${dims.width}px × ${dims.height}px (${ratio} ratio)`,
    "",
    "Image brief:",
    prompt,
    ...(brandKit ? ["", "Brand guidelines:", brandKit] : []),
  ].join("\n");

  console.log(`🤖 Calling Claude (claude-opus-4-6) to generate HTML...`);

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const html = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!html.toLowerCase().includes("<html") && !html.toLowerCase().includes("<!doctype")) {
    throw new Error(
      `Claude did not return valid HTML. Got: ${html.slice(0, 200)}`
    );
  }

  return html;
}

/**
 * Render an HTML string to a PNG via the Browserless Chromium service.
 * Writes the PNG to outPath.
 */
export async function renderHtmlToImage(
  html: string,
  ratio: string,
  outPath: string
): Promise<void> {
  const dims = RATIO_DIMENSIONS[ratio];
  if (!dims) throw new Error(`Unknown ratio: ${ratio}`);

  console.log(`🌐 Rendering HTML via Chromium at ${BROWSER_URL} (${dims.width}×${dims.height})...`);

  const body = JSON.stringify({
    html,
    viewport: {
      width: dims.width,
      height: dims.height,
      deviceScaleFactor: 1,
    },
    options: {
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: dims.width,
        height: dims.height,
      },
    },
  });

  const res = await fetch(`${BROWSER_URL}/screenshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "(no body)");
    throw new Error(`Chromium screenshot failed (HTTP ${res.status}): ${errText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buffer);

  console.log(`✅ PNG rendered and saved (${buffer.length} bytes)`);
}
