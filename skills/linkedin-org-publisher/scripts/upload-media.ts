#!/usr/bin/env bun
// upload-media.ts — Upload media (image or video) for a LinkedIn Company Page post
//
// Usage:
//   bun scripts/upload-media.ts \
//     --token "$LINKEDIN_ORG_ACCESS_TOKEN" \
//     --urn "$LINKEDIN_ORG_URN" \
//     --file "/path/to/image.jpg" \
//     --type image
//
//   bun scripts/upload-media.ts \
//     --token "$LINKEDIN_ORG_ACCESS_TOKEN" \
//     --urn "$LINKEDIN_ORG_URN" \
//     --file "/path/to/video.mp4" \
//     --type video
//
// Environment variables:
//   LINKEDIN_ORG_ACCESS_TOKEN — OAuth token with w_organization_social scope
//   LINKEDIN_ORG_URN          — urn:li:organization:XXXXXXXX

import { parseArgs, requireArg, registerOrgUpload, uploadFileBytes, type MediaType } from "./lib/linkedin-org.ts";
import { existsSync } from "fs";

const args     = parseArgs(process.argv);
const token    = requireArg(args, "token", "LINKEDIN_ORG_ACCESS_TOKEN");
const orgUrn   = requireArg(args, "urn", "LINKEDIN_ORG_URN");
const filePath = requireArg(args, "file");
const typeArg  = requireArg(args, "type") as MediaType;

if (!["image", "video"].includes(typeArg)) {
  console.error(`❌ --type must be "image" or "video", got: "${typeArg}"`);
  process.exit(1);
}

if (!existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

async function run(): Promise<void> {
  console.log(`📤 Registering ${typeArg} upload with LinkedIn...`);
  console.log(`📂 File: ${filePath}`);
  console.log(`🏢 Org URN: ${orgUrn}`);

  const { uploadUrl, assetUrn } = await registerOrgUpload({ token, orgUrn }, typeArg);
  console.log(`🔗 Upload URL obtained`);

  console.log(`📤 Uploading file bytes...`);
  await uploadFileBytes(uploadUrl, filePath, typeArg);

  console.log(`\n✅ Media uploaded successfully!`);
  console.log(`ASSET_URN=${assetUrn}`);
  console.log(`\n💡 Copy the ASSET_URN above and pass it to create-post.ts with --asset`);
}

run().catch((err) => {
  console.error("❌ Upload failed:", err.message);

  if (err.message.includes("401")) {
    console.error("💡 Token expired — generate a new one (see references/setup-guide.md)");
  } else if (err.message.includes("403")) {
    console.error("💡 Missing scope — ensure w_organization_social is granted to your LinkedIn app");
    console.error("   Note: This is different from w_member_social (personal posts)");
  } else if (err.message.includes("422")) {
    console.error("💡 Check org URN format: urn:li:organization:XXXXXXXX");
  }

  process.exit(1);
});
