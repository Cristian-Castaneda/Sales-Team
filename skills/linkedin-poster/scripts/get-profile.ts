#!/usr/bin/env bun
// get-profile.ts — Fetch your LinkedIn profile to find your Person URN.
//
// Usage:
//   bun scripts/get-profile.ts --token YOUR_ACCESS_TOKEN
//   bun scripts/get-profile.ts   (reads $LINKEDIN_ACCESS_TOKEN from env)

import { parseArgs, requireArg, linkedInHeaders } from "./lib/linkedin.ts";

const args = parseArgs(process.argv);
const token = requireArg(args, "token", "LINKEDIN_ACCESS_TOKEN");

async function getProfile(): Promise<void> {
  const res = await fetch("https://api.linkedin.com/v2/me", {
    headers: linkedInHeaders(token),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Failed to fetch profile (${res.status}): ${text}`);

    if (res.status === 401) {
      console.error("💡 Your token may be expired. Generate a new one — they last 60 days.");
      console.error("   See references/setup-guide.md for instructions.");
    }

    process.exit(1);
  }

  const data = await res.json();
  const id: string = data.id;
  const firstName: string = data.localizedFirstName ?? "";
  const lastName: string = data.localizedLastName ?? "";
  const urn = `urn:li:person:${id}`;

  console.log(`\n👤 Name:       ${firstName} ${lastName}`);
  console.log(`🆔 Person ID:  ${id}`);
  console.log(`🔗 Person URN: ${urn}`);
  console.log(`\n✅ Add this to your environment:`);
  console.log(`   export LINKEDIN_PERSON_URN="${urn}"`);
}

getProfile().catch((err) => {
  console.error("❌ Unexpected error:", err.message);
  process.exit(1);
});
