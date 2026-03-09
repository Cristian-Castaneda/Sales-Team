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
