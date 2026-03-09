// lib/workspace.ts — Shared workspace utilities for the product-owner skill

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";

/** Get the OpenClaw workspace root. Defaults to ~/.openclaw/workspace */
export function getWorkspaceRoot(): string {
  return process.env.OPENCLAW_WORKSPACE ?? join(process.env.HOME ?? "/root", ".openclaw", "workspace");
}

/** Return today's date as YYYY-MM-DD. */
export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Ensure a directory exists (recursive). */
export function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/** Read a workspace-relative file. Returns null if not found. */
export function readWorkspaceFile(relativePath: string): string | null {
  const fullPath = join(getWorkspaceRoot(), relativePath);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, "utf-8");
}

/** Write a workspace-relative file. Creates parent dirs if needed. Returns absolute path. */
export function writeWorkspaceFile(relativePath: string, content: string): string {
  const fullPath = join(getWorkspaceRoot(), relativePath);
  ensureDir(dirname(fullPath));
  writeFileSync(fullPath, content, "utf-8");
  return fullPath;
}

/** Parse CLI args into a key→value map. */
export function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith("--") && argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

/** Require a CLI arg or env var; exit with error if missing. */
export function requireArg(args: Record<string, string>, key: string, envKey?: string): string {
  const value = args[key] ?? (envKey ? process.env[envKey] : undefined);
  if (!value) {
    console.error(`❌ Missing required argument: --${key}${envKey ? ` (or env $${envKey})` : ""}`);
    process.exit(1);
  }
  return value;
}

/** Optionally read a CLI arg or env var. */
export function optionalArg(args: Record<string, string>, key: string, envKey?: string): string | undefined {
  return args[key] ?? (envKey ? process.env[envKey] : undefined);
}

/** Bump a version string (patch level). e.g. "0.2.0" → "0.2.1" */
export function bumpPatch(version: string): string {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "0.1.0";
  parts[2]++;
  return parts.join(".");
}
