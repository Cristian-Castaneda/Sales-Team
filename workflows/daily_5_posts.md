# Workflow: Daily 5 Organic Posts (LinkedIn + Meta)
id: daily_5_posts
status: active
runs: daily
goal: generate 5 post drafts/day for LinkedIn Page + Facebook Page + Instagram (as applicable)

## Inputs (defaults)
- posts_per_day: 5
- platforms: [linkedin, meta]
- language: es (default)
- content_mix:
  - 2 educational/value
  - 2 pain/objection
  - 1 product story / use case
- formats:
  - linkedin: image post (1:1) unless otherwise chosen
  - meta: ig_post (4:5) + fb_post (1:1) by default
- constraints:
  - no publishing without approval
  - no invented metrics/claims

## Steps
1) Research (Marketing Genius)
   - Pull 10 topic candidates:
     - 5 from audience pains (finance/admin in LATAM)
     - 3 from competitor angles
     - 2 from product capabilities (from Product Owner)
   - Select 5 topics using:
     - relevance + novelty + execution simplicity
   - Write `workspace/daily/<date>/topics.md`

2) Briefing (Marketing Genius)
   - For each topic create a mini-brief:
     - hook, key point, CTA, tone
     - recommended format (LI image, IG carousel, etc.)
   - Save: `workspace/daily/<date>/briefs/post-01.md` ... `post-05.md`

3) Copy (Copywriting)
   - For each brief:
     - LinkedIn copy (short)
     - Meta caption (shorter + optional hashtags)
     - 3 hook variants
   - Save into each post folder.

4) Image (Image Builder)
   - For each post:
     - Generate 1 image:
       - LI: 1:1
       - IG: 4:5 (or reuse if acceptable)
     - Enforce “NO logos/no brand names” unless brief allows
   - Save image(s) in each post folder.

5) Compile (Media Compiler)
   - For each post:
     - create a bundle folder:
       - final_copy.md
       - caption_meta.md
       - hashtags.md (optional)
       - image.png (or video.mp4)
       - notes.md
   - Save: `workspace/daily/<date>/bundles/post-01/` ... `post-05/`

6) Draft to platforms (Publishers)
   - LinkedIn Publisher:
     - validate + create Page draft (preferred)
     - otherwise produce “ready-to-post” with approval required
   - Meta Publisher:
     - validate + create draft-like containers (preferred)
     - otherwise “ready-to-post” with approval required
   - Save results to each bundle folder:
     - linkedin_draft_result.md
     - meta_draft_result.md

7) Daily summary (Marketing Genius)
   - write: `workspace/daily/<date>/summary.md`
   - include:
     - post topics
     - file paths
     - draft status
     - what you must approve

## Stop conditions
- If any post fails validation, skip posting that one and produce a fix note.
- Never publish automatically.