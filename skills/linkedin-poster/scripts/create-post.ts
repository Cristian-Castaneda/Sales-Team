#!/usr/bin/env bun
// create-post.ts — Create a LinkedIn post (text-only, image, or video).
//
// Usage:
//   # Text only
//   bun scripts/create-post.ts --token TOKEN --urn PERSON_URN --text "Hello LinkedIn!"
//
//   # With image or video (asset URN from upload-media.ts)
//   bun scripts/create-post.ts --token TOKEN --urn PERSON_URN --text "Hello!" --asset "urn:li:digitalmediaAsset:XXXXX"
//
//   # With copyright appended automatically
//   bun scripts/create-post.ts --token TOKEN --urn PERSON_URN --text "My post" --copyright "2025 Cristian"
//
// Environment variable fallbacks:
//   LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_URN

import {
  parseArgs,
  requireArg,
  createUGCPost,
} from "./lib/linkedin.ts";

const args      = parseArgs(process.argv);
const token     = requireArg(args, "token", "LINKEDIN_ACCESS_TOKEN");
const urn       = requireArg(args, "urn",   "LINKEDIN_PERSON_URN");
const rawText   = requireArg(args, "text");
const asset     = args["asset"];       // optional
const copyright = args["copyright"];   // optional

// Append copyright if provided
const postText = copyright
  ? `${rawText}\n\n© ${copyright}`
  : rawText;

// Validate text length
const MAX_CHARS = 3000;
if (postText.length > MAX_CHARS) {
  console.error(
    `❌ Post text too long: ${postText.length} characters (max ${MAX_CHARS})`
  );
  process.exit(1);
}

async function run(): Promise<void> {
  const postType = asset ? "media" : "text-only";
  console.log(`📝 Creating ${postType} LinkedIn post...`);
  console.log(`📄 Text preview: "${postText.slice(0, 80)}${postText.length > 80 ? "..." : ""}"`);

  if (asset) {
    console.log(`🖼  Asset URN: ${asset}`);
  }

  const { postUrn, postUrl } = await createUGCPost(
    { token, personUrn: urn },
    postText,
    asset
  );

  console.log(`\n✅ Post published successfully!`);
  console.log(`🔗 Post URL: ${postUrl}`);
  console.log(`🆔 Post URN: ${postUrn}`);

  // Warn about video processing lag
  if (asset) {
    console.log(`\n⏳ Note: If this was a video, LinkedIn may take a few minutes to process it.`);
    console.log(`   The post is live but the video thumbnail will appear shortly.`);
  }
}

run().catch((err) => {
  console.error("❌ Post creation failed:", err.message);

  // Helpful hints for common errors
  if (err.message.includes("401")) {
    console.error("💡 Token expired — generate a new one (see references/setup-guide.md)");
  } else if (err.message.includes("403")) {
    console.error("💡 Missing scope — add w_member_social to your LinkedIn Developer App");
  } else if (err.message.includes("422")) {
    console.error("💡 Check your URN format: urn:li:person:XXXXXXXX");
  }

  process.exit(1);
});
