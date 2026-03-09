---
name: meta-publisher
description: >
  Use this skill whenever the user wants to post, publish, draft, or schedule organic content
  on Facebook Pages or Instagram Business accounts. Handles all organic Meta platform publishing.
  Trigger for: "post to Facebook", "post to Instagram", "publish to our Facebook page",
  "create an Instagram post", "publish a reel to Instagram", "post a story to Facebook",
  "create an Instagram carousel", "schedule a Facebook post", "publish this image to Instagram",
  "post this video as a reel", "create an Instagram reel", "draft a Facebook post",
  "post to both Facebook and Instagram", "publish on Meta", "post on IG",
  "share on Facebook page", "create a post for Instagram and Facebook".
  Always validates content first, creates a container/draft, and requires explicit approval before publishing.
  Never posts automatically. Handles: fb_post, fb_reel, fb_story, ig_post, ig_reel, ig_story, ig_carousel.
---

# Meta Publisher Skill

Publish organic content to **Facebook Pages** and **Instagram Business** accounts safely.
Always validates content, creates a reviewable container or bundle, and requires explicit approval
before any publish action. Never posts automatically.

## First-Time Setup

```bash
bash scripts/setup.sh
```

See `references/setup-guide.md` for Meta Graph API token, Page ID, and IG User ID setup.

---

## Required Inputs

| Input          | Required | Description                                                                   |
|----------------|----------|-------------------------------------------------------------------------------|
| `job_id`       | Yes      | Unique job identifier                                                         |
| `platform`     | Yes      | facebook / instagram / both                                                   |
| `post_format`  | Yes      | fb_post / fb_reel / fb_story / ig_post / ig_reel / ig_story / ig_carousel    |
| `caption`      | Yes      | Final caption text                                                            |
| `media_path`   | No       | Absolute workspace path to image (JPG/PNG) or video (MP4)                    |
| `language`     | No       | es / en / pt (default: es)                                                    |
| `hashtags`     | No       | Space-separated hashtags (important for IG)                                   |
| `link_url`     | No       | Optional link (Facebook only — Instagram doesn't allow links in captions)     |
| `cover_path`   | No       | Cover image path (for reels)                                                  |

Store secrets as environment variables on the VPS:
```bash
export META_ACCESS_TOKEN="your_page_token_here"
export FB_PAGE_ID="your_facebook_page_id"
export IG_USER_ID="your_instagram_business_user_id"
```

---

## Format Guidance (aspect ratios and constraints)

| Format       | Ratio        | Media Required | Notes                            |
|--------------|--------------|----------------|----------------------------------|
| fb_post      | 1:1 or 4:5   | No (optional)  | Feed post; link supported        |
| fb_reel      | 9:16         | Yes (MP4)      | Short vertical video             |
| fb_story     | 9:16         | Yes            | 24h disappearing content         |
| ig_post      | 1:1 or 4:5   | Yes            | Feed post; no clickable links    |
| ig_reel      | 9:16         | Yes (MP4)      | Short vertical video             |
| ig_story     | 9:16         | Yes            | 24h disappearing content         |
| ig_carousel  | 1:1          | Yes (2–10)     | Multi-image post                 |

---

## Workflow

### Step 1 — Validate content

```bash
bun scripts/validate-post.ts \
  --job-id "<job_id>" \
  --platform "<platform>" \
  --format "<post_format>" \
  --caption "<caption>" \
  --media-path "<absolute_path_or_empty>"
```

Checks:
- Caption length is reasonable
- Hashtag count is appropriate for the platform (IG ≤ 30, FB ≤ 10)
- Media exists and matches the format requirements (ratio, format, size)
- No obvious spam or policy-triggering patterns

If fails → print specific issues → **STOP, do not continue**.

### Step 2 — Save validated bundle

```bash
bun scripts/save-bundle.ts \
  --job-id "<job_id>" \
  --platform "<platform>" \
  --format "<post_format>" \
  --caption "<caption>" \
  --media-path "<path_or_empty>" \
  --hashtags "<hashtags>"
```

Saves `workspace/social/meta/<date>/<job_id>/validated_caption.md` and assets.

### Step 3 — Create media container (approval-gated for IG / unpublished for FB)

Present the approval prompt first:
```
🟡 Bundle ready for review:
   Job: <job_id>
   Platform: <platform>
   Format: <post_format>
   Caption: "<first 200 chars>..."
   Media: <filename or "none">

Reply APPROVE <job_id> to create container and publish.
```

After receiving `APPROVE <job_id>`:

#### For Instagram:
```bash
bun scripts/create-container.ts \
  --token "$META_ACCESS_TOKEN" \
  --ig-user-id "$IG_USER_ID" \
  --job-id "<job_id>" \
  --format "<ig_post|ig_reel|ig_story>" \
  --media-path "<absolute_media_path>"
```
Prints `CONTAINER_ID=...` — capture this value.

Then publish the container:
```bash
bun scripts/publish-post.ts \
  --token "$META_ACCESS_TOKEN" \
  --ig-user-id "$IG_USER_ID" \
  --container-id "<CONTAINER_ID>" \
  --platform instagram \
  --job-id "<job_id>"
```

#### For Facebook:
```bash
bun scripts/create-container.ts \
  --token "$META_ACCESS_TOKEN" \
  --page-id "$FB_PAGE_ID" \
  --job-id "<job_id>" \
  --format "fb_post" \
  --media-path "<absolute_media_path_or_empty>"
```

For scheduled/unpublished FB posts, the container is already in a pending state — approve then publish:
```bash
bun scripts/publish-post.ts \
  --token "$META_ACCESS_TOKEN" \
  --page-id "$FB_PAGE_ID" \
  --container-id "<CONTAINER_ID>" \
  --platform facebook \
  --job-id "<job_id>"
```

### Step 4 — Report to user

- ✅ Published successfully
- 🔗 Post URL (printed by script)
- 📁 Bundle saved at `workspace/social/meta/<date>/<job_id>/`
- ⏳ If video/reel: processing may take a few minutes

---

## Review Gate (MANDATORY before any publish)

- [ ] Caption has no unverified claims
- [ ] Not spammy (excessive emojis or hashtags)
- [ ] CTA is clear and not misleading
- [ ] Media ratio matches the chosen format
- [ ] Duration acceptable for reels/stories
- [ ] No watermarks or weird artifacts in media
- [ ] Text (if any) is within safe area and readable
- [ ] Explicit approval received (`APPROVE <job_id>`)

---

## Error Reference

| HTTP Code | Meaning                   | Fix                                                     |
|-----------|---------------------------|---------------------------------------------------------|
| 190       | Token expired/invalid     | Re-generate Page token (see references/setup-guide.md)  |
| 200 (error) | OAuthException          | Check all scopes are granted                            |
| 100       | Invalid parameter         | Check Page ID / IG User ID format                       |
| 10        | App permission denied     | Add pages_manage_posts + instagram_content_publish      |
| 368       | Temporarily blocked       | Content may violate policy — review caption/media       |

---

## Notes / Limits

- **Instagram**: does not support links in captions — bio link only
- **Facebook**: supports link previews in feed posts
- **IG Reels**: video must be 3–90 seconds, 9:16 vertical
- **IG Carousel**: 2–10 items, same ratio for all images
- **FB Reels**: similar to IG Reels; 9:16 preferred
- Media uploads are direct to Meta's servers via container creation
- IG container status may take 10–60s to process before publishing
- This skill is for **organic** posts only — not Meta Ads (paid)
