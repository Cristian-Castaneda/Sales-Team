---
name: skill-builder
description: >
  Use this skill whenever the user wants to CREATE, BUILD, DESIGN, or GENERATE a new OpenClaw skill.
  Trigger for any mention of: "build a skill", "create a skill", "make a skill", "new skill for",
  "write a skill that", "I need a skill to", "add a skill", "skill for posting", "skill for sending",
  "skill for reading", "skill for automating", or any workflow the user wants to automate inside OpenClaw.
  This skill uses Claude claude-sonnet-4-6 to generate all skill files.
---

# Skill Builder — Builds Other OpenClaw Skills

This meta-skill interviews the user about a desired workflow, then generates a complete,
ready-to-install OpenClaw skill using the Claude API (claude-sonnet-4-6).

## Environment Requirements

Run setup.sh once on first use:
```bash
bash scripts/setup.sh
```

Requires:
- `ANTHROPIC_API_KEY` — Anthropic API key for Claude claude-sonnet-4-6
- Bun runtime (installed by setup.sh)

---

## Workflow

### Step 1 — Gather Requirements

Ask the user these questions (can be answered in one message):

1. **What should the skill do?** — Describe the workflow in plain language
2. **What inputs does it take?** — Files, text, URLs, credentials?
3. **What external APIs or services does it use?** — LinkedIn, Slack, email, etc.?
4. **What should the output/confirmation be?** — URL, file, message, etc.?

### Step 2 — Run the Skill Generator

Once requirements are clear, run:

```bash
bun scripts/generate-skill.ts \
  --description "Full description of what the skill should do" \
  --out "./generated-skills"
```

The script calls Claude claude-sonnet-4-6 with the full OpenClaw skill specification
and outputs a complete skill folder ready to install.

### Step 3 — Review and Install

The generated skill folder appears in `./generated-skills/skill-name/`.

Review the output, then install:
```bash
# Copy to your skills directory
cp -r ./generated-skills/skill-name /path/to/openclaw/skills/

# Run its setup if it has one
bash /path/to/openclaw/skills/skill-name/scripts/setup.sh
```

### Step 4 — Confirm to User

Tell the user:
- ✅ Skill generated: `skill-name`
- 📁 Files created: list the files
- 🔧 Next step: any setup they need to do (API keys, etc.)

---

## Error Reference

| Error | Fix |
|-------|-----|
| Missing ANTHROPIC_API_KEY | Set env var: `export ANTHROPIC_API_KEY="sk-ant-..."` |
| Bun not found | Run `bash scripts/setup.sh` first |
| API rate limit | Wait a moment and retry |

---

## Notes

- Generated skills always follow the standard OpenClaw structure
- All scripts are TypeScript, run with Bun
- Shared logic always goes in `scripts/lib/`
- The generator uses claude-sonnet-4-6 for highest quality output
