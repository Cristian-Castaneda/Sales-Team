---
name: video-builder
description: >
  Use this skill whenever the user wants to generate, create, or produce a marketing video,
  reel, short-form clip, or any AI-generated video asset.
  Trigger for: "generate a video", "create a reel", "make a short video", "create a video for this ad",
  "generate a 9:16 video", "make an Instagram reel", "create a LinkedIn video", "generate a UGC clip",
  "make a cinematic video", "create a short for this campaign", "build the video for post X",
  "generate a video with this concept". Also trigger when marketing-genius handoff includes
  video asset requests. Saves all outputs to workspace. Never publishes.
  Primary generator: Veo (via Google Flow). Fallback: Runway Gen-4.5.
  Subskills: animate-image (take a static image and animate its text/elements for video ads).
---

# Video Builder Skill

Generate short, realistic marketing videos (reels/shorts/ads-style clips) from a creative brief.
Primary generator: **Veo via Google Flow** — best realism + vertical workflow support.
Fallback: **Runway Gen-4.5** — if Veo quality or controls aren't sufficient.

Always saves outputs to workspace. Requires review gate before delivering. Never publishes.

## First-Time Setup

```bash
bash scripts/setup.sh
```

---

## Brand Kit

Reads `config/brandKit.md` before building any video or animation prompt.
Extracts color palette, gradient values, and font guidance to keep outputs on-brand.
If not found, prints a warning and continues — never blocks.

---

## Required Inputs

| Input                   | Required | Description                                                         |
|-------------------------|----------|---------------------------------------------------------------------|
| `job_id`                | Yes      | Unique job identifier                                               |
| `format`                | Yes      | 9:16 (default) / 16:9 / 1:1                                        |
| `duration_seconds`      | Yes      | Target duration (default: 6–10s)                                    |
| `realism_target`        | Yes      | high / medium                                                       |
| `creative_concept`      | Yes      | 1–3 sentences describing the scene, message, and mood               |
| `text_policy`           | Yes      | `no_text` OR `exact_text` with verbatim on-screen lines             |
| `script_or_voiceover`   | No       | Optional voiceover script or on-screen narration text               |
| `reference_images`      | No       | Workspace paths to reference images from image-builder              |
| `style`                 | No       | ugc_realistic / cinematic / handheld / tripod (default: ugc_realistic) |
| `language`              | No       | es / en / pt                                                         |

---

## Workflow

### Step 1 — Build video prompt pack

Construct the generation prompt with this exact structure:

1. **Format + duration** at the very top:
   `"[9:16 vertical, 8 seconds]"`

2. **Scene description** — setting, characters (if any), action
   - Use "a person" / "hands" / "office environment" — avoid named people

3. **Realism cues** (for `realism_target: high`):
   - "natural lighting", "handheld camera feel", "realistic skin texture",
   - "no CGI look", "natural motion blur"

4. **Text policy** (exact wording):
   - `no_text`: `"NO on-screen text of any kind."`
   - `exact_text`: `"The ONLY on-screen text must be exactly: {verbatim lines}"`

5. **Shot plan** (1–2 shots max for v1):
   - e.g. "Shot 1: close-up of hands typing on laptop. Shot 2: wide shot of office."

6. **Exclusions** (always end with):
   `"NO logos. NO brand names. NO watermarks. NO weird artifacts. NO AI wobble."`

---

### Step 2 — Generate via Veo (primary)

Use the Veo/Google Flow API or interface to submit the prompt pack.

Inputs to Veo:
- Prompt (built above)
- Aspect ratio
- Duration
- Reference images (if provided)

Save the output video to:
```
workspace/assets/videos/<yyyy-mm-dd>/<job_id>/video-<job_id>-v1.mp4
```

If Veo output is not acceptable after 2 tries:
- Simplify prompt (fewer shots, fewer elements)
- Strengthen exclusions
- If still failing → switch to Runway fallback

---

### Step 3 — Fallback: Runway Gen-4.5

Use Runway Gen-4 API if Veo fails or quality is insufficient.

Same prompt structure applies. Save output as:
```
workspace/assets/videos/<yyyy-mm-dd>/<job_id>/video-<job_id>-v1-runway.mp4
```

---

### Step 4 — Review gate (MANDATORY — do NOT skip)

Check the generated video:
- [ ] Duration is correct (±1s of requested)
- [ ] Aspect ratio is correct and framed for mobile safe area (9:16)
- [ ] No hallucinated logos, brand marks, or watermarks
- [ ] No artifacts: melting faces/hands, unreadable text, sudden jumps, AI wobble
- [ ] Realism target met: natural motion, consistent lighting, no CGI feel
- [ ] If text required: exact text matches verbatim (no extra words)
- [ ] CTA is present (in caption or voiceover plan)

**If any item fails:**
- Simplify prompt (fewer characters/shots/elements)
- Strengthen exclusions
- Try different realism cues
- If v2 also fails: switch generator (Veo → Runway)

---

### Step 5 — Save notes and deliver

Write `workspace/assets/videos/<yyyy-mm-dd>/<job_id>/notes.md` with:
- Brief summary
- Prompt/inputs used
- Generator used (veo / runway)
- Duration + ratio
- Review gate results
- Recommended caption + hook text (optional)

Report to user:
- ✅ Video generated and reviewed
- 📁 Path: `workspace/assets/videos/<date>/<job_id>/video-<job_id>-v1.mp4`
- 📝 Notes: `workspace/assets/videos/<date>/<job_id>/notes.md`

---

## Review Gate — Common Fixes

| Problem                     | Fix                                                                 |
|-----------------------------|---------------------------------------------------------------------|
| AI wobble / unnatural motion | Add "natural motion, realistic physics, no AI artifacts"           |
| Melting faces or hands       | Remove characters; use objects/hands/environments only             |
| Wrong duration               | State duration in seconds explicitly at start of prompt            |
| Hallucinated text/logos      | Strengthen exclusions; add "NO text, NO UI elements, NO brands"    |
| Generic/stock feel           | Add specific setting details (lighting type, material texture)     |

---

## Notes / Limits

- **Preferred format**: 9:16 vertical for organic social performance
- **Preferred style**: UGC realistic (performs best organically)
- **Preferred duration**: 6–10 seconds
- **Max shots for v1**: 1–2 shots (add more in v2+ if needed)
- Always prefer Veo for v1; only switch to Runway if Veo fails
- Video generation may take several minutes — inform user
- This skill has no generation scripts (API wiring comes later); agent orchestrates manually
- Output folder: `workspace/assets/videos/<date>/<job_id>/`

---

## Subskill: animate-image

Take a static image (from image-builder or any workspace asset) and produce an animated video
clip suitable for video ads. The animation brings text and visual elements to life using
fade-in, slide-in, zoom, or other motion techniques — no new scene generation, just motion
applied to the existing image.

### Trigger phrases

"animate this image", "animate the text in this image", "make this image move",
"add animation to this visual", "create an animated version of this image",
"turn this image into a video clip", "animate this for a video ad".

### Required Inputs

| Input            | Required | Description |
|------------------|----------|-------------|
| `source_image`   | Yes      | Workspace path to the image to animate (e.g. `workspace/assets/images/...`) |
| `duration_seconds` | Yes    | How long the animated clip should be (e.g. 3, 5, 6, 8, 10) |
| `animation_style` | Yes     | `fade_in` / `slide_in` / `zoom_in` / `mixed` / `custom` |
| `text_elements`  | No       | List the text lines that should animate (if image has text) |
| `animation_notes` | No      | Extra direction: "text fades in line by line", "background zooms slowly", etc. |
| `format`         | No       | 9:16 / 16:9 / 1:1 — must match source image ratio (default: inherit from image) |
| `job_id`         | Yes      | Unique job identifier |

### Animation Styles Reference

| Style | Description |
|-------|-------------|
| `fade_in` | Elements appear gradually from transparent to opaque |
| `slide_in` | Elements enter from edge (bottom, left, or right) |
| `zoom_in` | Subtle Ken Burns zoom on the background image |
| `mixed` | Background zooms while text fades/slides in sequentially |
| `custom` | Described via `animation_notes` |

### Workflow

#### Step 1 — Read brand kit

Read `config/brandKit.md` to confirm colors and fonts match the source image.
Note the primary/secondary colors and font families for context.

#### Step 2 — Analyze source image

Identify:
- Dimensions and aspect ratio
- Text elements present (headings, body copy, CTA)
- Background type (solid, gradient, photo)
- Composition zones (where text sits vs background)

#### Step 3 — Build animation prompt

Construct the animation description with this structure:

1. **Source + format + duration** at the top:
   `"[Animate static image. 9:16 vertical. {duration_seconds} seconds.]"`

2. **Background motion** (always add subtle motion to avoid static feel):
   - For photo backgrounds: `"Background image applies a slow Ken Burns zoom (scale 1.0 → 1.05 over full duration)."`
   - For solid/gradient backgrounds: `"Background holds steady or applies a very subtle pulse."`

3. **Text animation** (sequence each text element):
   - Heading: `"Heading text fades in from transparent, starting at 0.3s, complete by 1.2s."`
   - Body copy: `"Body text slides up from 20px below, starting at 1.0s, complete by 2.0s."`
   - CTA: `"CTA button fades in and scales from 0.9 → 1.0, starting at 2.0s."`
   - Stagger each element by 0.5–1.0s for a clean reveal sequence.

4. **Hold frame**: `"Hold final frame fully visible for last {hold_seconds}s before fade out."`

5. **Exclusions**: `"NO new visual elements. NO text changes. NO color changes. Animate existing content only."`

#### Step 4 — Generate via Runway (primary for animate-image)

Runway Gen-4 Image-to-Video is the preferred tool for static image animation.

Inputs:
- Source image
- Animation prompt (built above)
- Duration
- Aspect ratio

Save output to:
```
workspace/assets/videos/<yyyy-mm-dd>/<job_id>/animated-<job_id>-v1.mp4
```

If Runway output is not acceptable after 2 tries → switch to Veo with the same prompt.

#### Step 5 — Review gate (MANDATORY)

- [ ] Duration matches requested duration (±0.5s)
- [ ] Aspect ratio matches source image
- [ ] Text elements animate cleanly — no flicker, no garbling
- [ ] Background motion is subtle, not distracting
- [ ] No new elements introduced (no logos, no extra text, no artifacts)
- [ ] Final hold frame is clean and readable
- [ ] Clip feels polished enough for a video ad

**If any item fails:** simplify the animation description, reduce simultaneous elements,
re-run. Max v3 before flagging to user.

#### Step 6 — Save notes and deliver

Write `workspace/assets/videos/<yyyy-mm-dd>/<job_id>/notes.md` with:
- Source image path
- Animation style used
- Duration
- Prompt used
- Generator used
- Review gate results

Report to user:
- Animated clip path: `workspace/assets/videos/<date>/<job_id>/animated-<job_id>-v1.mp4`
- Notes path: `workspace/assets/videos/<date>/<job_id>/notes.md`

### animate-image — Common Fixes

| Problem | Fix |
|---------|-----|
| Text flickers or disappears | Reduce animation speed; add explicit hold timing |
| Animation feels too fast | Spread stagger to 1.0–1.5s between elements |
| Background zoom too aggressive | Change to scale 1.0 → 1.03 (very subtle) |
| New elements appear (artifacts) | Strengthen "NO new elements" exclusion |
| Clip duration is wrong | State duration explicitly at start AND end of prompt |
