#!/usr/bin/env bun
// upload-media.ts — Upload an image or video to LinkedIn before creating a post.
// Prints the asset URN which you then pass to create-post.ts.
//
// Usage:
//   bun scripts/upload-media.ts --token TOKEN --urn PERSON_URN --file ./photo.jpg --type image
//   bun scripts/upload-media.ts --token TOKEN --urn PERSON_URN --file ./video.mp4 --type video
//
// Environment variable fallbacks:
//   LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_URN

import { existsSync, statSync } from "node:fs";
import {
  parseArgs,
  requireArg,
  registerUpload,
  uploadFileBytes,
  type MediaType,
} from "./lib/linkedin.ts";

const args = parseArgs(process.argv);
const token  = requireArg(args, "token", "LINKEDIN_ACCESS_TOKEN");
const urn    = requireArg(args, "urn",   "LINKEDIN_PERSON_URN");
const file   = requireArg(args, "file");
const type   = requireArg(args, "type") as MediaType;

if (type !== "image" && type !== "video") {
  console.error('❌ --type must be "image" or "video"');
  process.exit(1);
}

if (!existsSync(file)) {
  console.error(`❌ File not found: ${file}`);
  process.exit(1);
}

// Validate file size
const fileSizeBytes = statSync(file).size;
const fileSizeMB    = fileSizeBytes / (1024 * 1024);
const maxSizeMB     = type === "image" ? 10 : 200;

if (fileSizeMB > maxSizeMB) {
  console.error(
    `❌ File too large: ${fileSizeMB.toFixed(1)}MB (max ${maxSizeMB}MB for ${type})`
  );
  process.exit(1);
}

async function run(): Promise<void> {
  console.log(`📤 Registering ${type} upload with LinkedIn...`);

  const { uploadUrl, assetUrn } = await registerUpload({ token, personUrn: urn }, type);

  console.log(`📤 Uploading ${file} (${fileSizeMB.toFixed(1)}MB)...`);

  await uploadFileBytes(uploadUrl, file, type);

  console.log(`\n✅ Upload complete!`);
  console.log(`ASSET_URN=${assetUrn}`);
  console.log(`\n💡 Pass this to create-post.ts:`);
  console.log(`   --asset "${assetUrn}"`);
}

run().catch((err) => {
  console.error("❌ Upload failed:", err.message);
  process.exit(1);
});
