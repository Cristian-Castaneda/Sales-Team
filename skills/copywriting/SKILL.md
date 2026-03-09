---
name: copywriting
description: >
  Use this skill whenever the user wants to write, draft, generate, or create marketing text of any kind.
  Trigger for: write a tagline, write a LinkedIn post, write ad copy, write a headline, write a blog post,
  write a landing page section, write email copy, write a video script, create copy variants, rewrite text,
  generate hooks, write a case study, create a caption, make it funnier, make it shorter, change the tone.
  Also trigger for: "I need copy for", "draft something for", "help me write", "give me options",
  "write 10 versions", "translate this for LinkedIn", "write a description for".
  Handles any length from 20-character taglines to 2000+ word blog posts. Never publishes — saves drafts only.
---

# Copywriting Skill

Generate marketing and informational text of any length and style — taglines, headlines, posts, blog posts,
ad copy, scripts, email sequences. Always saves drafts to workspace. Never publishes.

## First-Time Setup

```bash
bash scripts/setup.sh
```

---

## Required Inputs

| Input         | Required | Description                                                                 |
|---------------|----------|-----------------------------------------------------------------------------|
| `output_type` | Yes      | tagline / headline / linkedin_post / ad_copy / blog_post / email / script / caption / landing_page / case_study |
| `tone`        | Yes      | direct / funny / formal_b2b / mysterious / clickbait / informational        |
| `goal`        | Yes      | CTA goal: book_demo / reply_whatsapp / visit_pricing / download_checklist / request_trial / awareness |
| `context`     | Yes      | Product/audience/campaign context (free text from user or from workspace)   |
| `length`      | No       | max_characters:N / max_words:N / target_words:N / exact_format description  |
| `language`    | No       | es / en / pt (default: es)                                                  |
| `channel`     | No       | linkedin / blog / email / google_ads / instagram / meta                     |
| `job_id`      | No       | Job identifier; auto-generated (YYYYMMDD-HHMMSS) if not provided            |
| `campaign_id` | No       | Campaign ID to read the corresponding brief from workspace                  |
| `variants`    | No       | Number of copy variants to generate (default: 1)                            |

---

## Workflow

### Step 1 — Read brand kit and brief (if available)

```bash
bun scripts/read-brief.ts --type brand_kit
```

```bash
bun scripts/read-brief.ts --type campaign_brief --campaign-id <campaign_id>
```

Prints brand voice rules and campaign direction to stdout.
If files don't exist, continue with user-provided context only — don't block.

### Step 2 — Generate the copy

The agent writes the copy based on the provided inputs, applying:
- Length constraint strictly (count characters/words before returning)
- Tone and style as specified
- CTA woven in naturally for the chosen channel
- No invented facts, metrics, certifications, or customer names

If `variants > 1`: generate each variant separately with distinct angles.

### Step 3 — Hallucination guard

Extract factual claims from the draft. For each claim:
- Backed by provided context → keep as-is
- Unverified → soften ("can help", "often reduces") or flag as `[UNVERIFIED — needs evidence]`
- If `tone=informational` or user said "must be factual" → use web_search to verify before continuing

### Step 4 — Save draft to workspace

```bash
bun scripts/save-draft.ts \
  --job-id "<job_id>" \
  --type "<output_type>" \
  --file "draft.md" \
  --content "<generated_copy>"
```

If variants were generated:
```bash
bun scripts/save-draft.ts \
  --job-id "<job_id>" \
  --type "<output_type>" \
  --file "variants.md" \
  --content "<all_variants>"
```

Notes file (always save):
```bash
bun scripts/save-draft.ts \
  --job-id "<job_id>" \
  --type "<output_type>" \
  --file "notes.md" \
  --content "<inputs_summary_and_claims_list>"
```

### Step 5 — Report to user

- ✅ Copy generated and saved
- 📁 Path: `workspace/copy/<date>/<job_id>/draft.md`
- ⚠️ Any unverified claims flagged inline
- 🤝 Recommended next step (media_compiler / image-builder / ads builder)

---

## Review Gate (MANDATORY before delivering)

- [ ] Length constraint satisfied (count was checked)
- [ ] Tone matches requested style
- [ ] CTA is clear and channel-appropriate
- [ ] No invented facts, numbers, certifications, or awards
- [ ] Factual claims are verified, softened, or explicitly flagged

---

## Error Reference

| Code | Meaning                   | Fix                                              |
|------|---------------------------|--------------------------------------------------|
| N/A  | Brand kit not found       | Create `workspace/brand/brand_kit.md` first      |
| N/A  | Campaign brief not found  | Run marketing-genius skill first                 |
| N/A  | Length constraint exceeded | Recount and trim before saving                  |

---

## Notes / Limits

- Default language: **es** (Spanish)
- Max recommended blog post via single call: 2 000 words (request chunking for more)
- The agent writes the copy; scripts only handle workspace I/O
- For "max_characters" tasks: always count before returning — do not estimate
- Multiple variants: generate in one pass, clearly labelled `## Variant 1`, `## Variant 2`, etc.
