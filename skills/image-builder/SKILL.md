---
name: image-builder
description: >
  Use this skill whenever the user wants to generate, create, or produce a marketing image,
  ad visual, social media graphic, banner, or any AI-generated image asset.
  Trigger for: "generate an image", "create an image for this post", "make a visual for the ad",
  "generate a LinkedIn image", "create an Instagram graphic", "make a 1:1 image",
  "generate a 9:16 image for stories", "create a product image", "build the image for campaign X",
  "generate an image with this text on it", "create a native ad image", "make a bold claim visual",
  "generate a testimonial image". Also trigger when marketing-genius or copywriting handoff includes
  image asset requests. Saves all outputs to workspace. Never publishes.
---

# Image Builder Skill

Generate high-quality marketing images for ads and organic posts via the `nano-banana-pro` generator.
Follows brand guidelines, applies strict review gate, saves outputs to workspace. Never publishes.

## First-Time Setup

```bash
bash scripts/setup.sh
```

Verify the generator is available:
```bash
nano-banana-pro --version
```

---

## Required Inputs

| Input              | Required | Description                                                              |
|--------------------|----------|--------------------------------------------------------------------------|
| `job_id`           | Yes      | Unique job identifier (e.g. from campaign)                               |
| `ad_type`          | Yes      | native / price_anchor / tutorial / testimonial / bold_claim / product_mock |
| `aspect_ratio`     | Yes      | 1:1 / 4:5 / 9:16 / 16:9 (default: 1:1)                                 |
| `creative_concept` | Yes      | 1–3 sentences describing the scene/message                               |
| `text_policy`      | Yes      | `no_text` OR `exact_text` with verbatim lines                            |
| `style_notes`      | No       | Lighting, material, mood cues (e.g. "UGC realistic", "cinematic")        |
| `language`         | No       | es / en / pt                                                              |

---

## Workflow

### Step 1 — Read brand kit (if available)

```bash
bun scripts/generate-image.ts --check-brand
```

Reads `config/brandKit.md` and prints brand color and style constraints.
If not found, prints a warning and continues — never blocks.

### Step 2 — Build the image prompt

The agent constructs the prompt following this exact structure:
1. Aspect ratio at the very start: `[1:1 aspect ratio]` or `[9:16 vertical]`
2. Scene/setting description
3. Layout and composition guidance
4. **Text policy** (exact wording required):
   - `no_text`: `"NO text of any kind on the image."`
   - `exact_text`: `"The ONLY text on the image must be exactly: {verbatim lines}"`
5. Exclusions at the end:
   `"NO logos. NO brand names. NO watermarks. NO extra text. NO extra decorative elements."`

If brand kit exists: add color palette and style guidance from it.

### Step 3 — Generate image

```bash
bun scripts/generate-image.ts \
  --job-id "<job_id>" \
  --ratio "<aspect_ratio>" \
  --prompt "<full_prompt>" \
  --version "v1"
```

The script calls `nano-banana-pro`, saves the output image to the workspace, and prints the file path.

### Step 4 — Review gate (MANDATORY — do NOT skip)

Check the generated image:
- [ ] Text accuracy: if text was required, it matches verbatim (no typos, no extra words)
- [ ] No hallucinated logos, brand marks, or watermarks
- [ ] Aspect ratio is correct and composition is clean
- [ ] No unexpected objects, UI artifacts, or weird elements
- [ ] Looks clean enough for ads/social
- [ ] Realism/style target is met

**If any item fails:**
```bash
bun scripts/generate-image.ts \
  --job-id "<job_id>" \
  --ratio "<aspect_ratio>" \
  --prompt "<simplified_prompt>" \
  --version "v2"
```
Simplify the prompt, tighten exclusions, reduce elements. Iterate until gate passes (max v5).

### Step 5 — Save notes and deliver

```bash
bun scripts/write-notes.ts \
  --job-id "<job_id>" \
  --ad-type "<ad_type>" \
  --ratio "<aspect_ratio>" \
  --prompt "<final_prompt_used>" \
  --selected "image-<job_id>-v1.png" \
  --review-notes "<gate_results>" \
  --caption-ideas "<optional_1_or_2_ideas>"
```

Report to user:
- ✅ Image generated and reviewed
- 📁 Path: `workspace/assets/images/<date>/<job_id>/image-<job_id>-v1.png`
- 📝 Notes: `workspace/assets/images/<date>/<job_id>/notes.md`
- 🖼️ Caption ideas (optional)

---

## Review Gate — Common Fixes

| Problem                   | Fix                                                                  |
|---------------------------|----------------------------------------------------------------------|
| Garbled text              | Reduce number of lines; make "ONLY text exactly:" stricter           |
| Hallucinated logos/brands | Strengthen exclusions; simplify scene (less empty space)             |
| Unwanted decorations      | Add "no borders, no frames, no badges, no extra icons"               |
| Generic/stock look        | Add concrete style cues (lighting, material, texture, setting)       |
| Wrong aspect ratio        | State ratio first in prompt; verify --ratio flag matches             |

---

## Error Reference

| Situation                    | Fix                                                    |
|------------------------------|--------------------------------------------------------|
| `nano-banana-pro not found`  | Check container PATH; skill is bundled with OpenClaw   |
| Brand kit not found          | Warning only — continue without brand constraints      |
| Output directory not found   | Script creates it automatically                        |
| Review gate fails after v5   | Reduce concept complexity; remove text requirement     |

---

## Notes / Limits

- Aspect ratios: 1:1 (feed), 4:5 (feed recommended), 9:16 (stories/reels), 16:9 (landscape/thumbnail)
- Default: 1:1
- Never add logos or brand names unless the brief explicitly allows it
- For video thumbnails: use 16:9
- The agent builds the prompt; the script handles generation and file I/O
- All outputs go to `workspace/assets/images/<date>/<job_id>/`
