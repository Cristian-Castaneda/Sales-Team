#!/usr/bin/env bun
// generate-skill.ts — Generate a complete OpenClaw skill using Claude claude-sonnet-4-6
//
// Usage:
//   bun scripts/generate-skill.ts --description "A skill that posts to Slack" --out ./generated-skills
//
// Environment:
//   ANTHROPIC_API_KEY   Your Anthropic API key

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { OPENCLAW_SYSTEM_PROMPT } from "./lib/openclaw-spec.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratedFile {
  path: string;
  content: string;
}

interface SkillOutput {
  skillName: string;
  description: string;
  files: GeneratedFile[];
  setupSteps: string[];
  requiredEnvVars: { name: string; description: string }[];
}

// ─── Args ─────────────────────────────────────────────────────────────────────

function parseArgs(): { description: string; out: string } {
  const args: Record<string, string> = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith("--") && process.argv[i + 1]) {
      args[process.argv[i].slice(2)] = process.argv[i + 1];
      i++;
    }
  }

  if (!args.description) {
    console.error("❌ Missing --description");
    console.error('   Example: bun generate-skill.ts --description "Post messages to Slack" --out ./generated-skills');
    process.exit(1);
  }

  return {
    description: args.description,
    out: args.out ?? "./generated-skills",
  };
}

// ─── Claude API ───────────────────────────────────────────────────────────────

async function callClaude(description: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY is not set.");
    console.error("   export ANTHROPIC_API_KEY=\"sk-ant-...\"");
    process.exit(1);
  }

  const userPrompt = `Generate a complete OpenClaw skill for the following requirement:

${description}

Remember: respond ONLY with the raw JSON object. No markdown, no explanation, no fences.`;

  console.log("🤖 Calling Claude claude-sonnet-4-6...");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: OPENCLAW_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.content?.map((b: { text?: string }) => b.text ?? "").join("") ?? "";
}

// ─── File Writer ──────────────────────────────────────────────────────────────

function writeSkillFiles(output: SkillOutput, outDir: string): void {
  for (const file of output.files) {
    const fullPath = join(outDir, file.path);
    const dir = dirname(fullPath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(fullPath, file.content, "utf-8");

    // Make shell scripts executable
    if (fullPath.endsWith(".sh")) {
      const { execSync } = await import("node:child_process");
      try { execSync(`chmod +x "${fullPath}"`); } catch {}
    }

    console.log(`   📄 ${file.path}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { description, out } = parseArgs();

  console.log(`\n⚡ OpenClaw Skill Builder`);
  console.log(`📋 Requirement: ${description}`);
  console.log(`📁 Output dir:  ${out}\n`);

  // Call Claude
  const raw = await callClaude(description);

  // Parse JSON response
  let skillOutput: SkillOutput;
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    skillOutput = JSON.parse(clean);
  } catch {
    console.error("❌ Failed to parse Claude's response as JSON.");
    console.error("Raw response:\n", raw);
    process.exit(1);
  }

  console.log(`✅ Skill designed: "${skillOutput.skillName}"`);
  console.log(`📝 ${skillOutput.description}\n`);
  console.log(`📦 Writing files...`);

  // Write all files
  writeSkillFiles(skillOutput, out);

  // Print summary
  console.log(`\n✅ Skill generated successfully!\n`);

  if (skillOutput.requiredEnvVars.length > 0) {
    console.log(`🔑 Required environment variables:`);
    for (const env of skillOutput.requiredEnvVars) {
      console.log(`   export ${env.name}="..."   # ${env.description}`);
    }
    console.log("");
  }

  if (skillOutput.setupSteps.length > 0) {
    console.log(`🚀 Setup steps:`);
    skillOutput.setupSteps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
    console.log("");
  }

  console.log(`📁 Skill location: ${out}/${skillOutput.skillName}/`);
  console.log(`💡 Install: copy the folder to your OpenClaw skills directory`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
