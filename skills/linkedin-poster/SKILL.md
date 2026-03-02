---
name: linkedin-poster
description: >
  Use this skill whenever the user wants to post, publish, or share content on LinkedIn.
  Trigger for any mention of: LinkedIn post, LinkedIn publishing, sharing to LinkedIn,
  social media post, posting with an image or video to LinkedIn, writing a LinkedIn caption,
  or posting with copyright/attribution text. Handles text-only posts, image posts (JPG/PNG),
  and video posts (MP4) with captions and copyright lines. Posts immediately on the user's behalf.
  Scripts run with Bun (TypeScript runtime). Run setup.sh first if Bun is not installed.
---

# LinkedIn Poster Skill

Post text, images, or videos directly to LinkedIn via the LinkedIn API.
Scripts are written in TypeScript and executed with Bun.

## First-Time Setup

If Bun is not installed in the container, run once:

```bash
bash scripts/setup.sh
```

This installs Bun and all required dependencies.

---

## Required Inputs

Before running, confirm you have:
- `LINKEDIN_ACCESS_TOKEN` — OAuth 2.0 token (see references/setup-guide.md if not set up yet)
- `LINKEDIN_PERSON_URN` — your LinkedIn member ID (format: `urn:li:person:XXXXXXXX`)

Store them as environment variables on the VPS:
```bash
export LINKEDIN_ACCESS_TOKEN="your_token_here"
export LINKEDIN_PERSON_URN="urn:li:person:xxxxxxxx"
```

Or pass them directly as flags to each script.

---

## Collect Inputs from User

Ask the user for anything missing:

| Input         | Required | Description                                      |
|---------------|----------|--------------------------------------------------|
| `post_text`   | Yes      | The main body text of the post                   |
| `copyright`   | No       | Attribution line — appended as `\n\n© {text}`    |
| `media_file`  | No       | Local path to image (JPG/PNG) or video (MP4)     |

If `copyright` is provided, append it to the post text like:
```
{post_text}

© {copyright}
```

---

## Workflow

### Step 1 — Determine Post Type

| Has media? | Extension  | Post type   |
|------------|------------|-------------|
| No         | —          | Text-only   |
| Yes        | jpg / png  | Image post  |
| Yes        | mp4        | Video post  |

### Step 2 — Upload Media (skip for text-only)

```bash
bun scripts/upload-media.ts \
  --token "$LINKEDIN_ACCESS_TOKEN" \
  --urn "$LINKEDIN_PERSON_URN" \
  --file "/path/to/photo.jpg" \
  --type image
```

Prints `ASSET_URN=urn:li:digitalmediaAsset:XXXXX` — capture this value.

### Step 3 — Create the Post

```bash
# Text-only
bun scripts/create-post.ts \
  --token "$LINKEDIN_ACCESS_TOKEN" \
  --urn "$LINKEDIN_PERSON_URN" \
  --text "Your post text here"

# With media
bun scripts/create-post.ts \
  --token "$LINKEDIN_ACCESS_TOKEN" \
  --urn "$LINKEDIN_PERSON_URN" \
  --text "Your post text here" \
  --asset "urn:li:digitalmediaAsset:XXXXX"
```

### Step 4 — Confirm to User

Report back:
- ✅ Post published successfully
- 🔗 Post URL (printed by script)
- ⏳ If video: note it may take a few minutes to process

---

## Finding Your Person URN

If the user doesn't know their URN:

```bash
bun scripts/get-profile.ts --token "$LINKEDIN_ACCESS_TOKEN"
```

Prints name, ID, and the full URN string to copy.

---

## Error Reference

| HTTP Code | Meaning                  | Fix                                              |
|-----------|--------------------------|--------------------------------------------------|
| 401       | Token expired/invalid    | Re-generate access token (see references/setup-guide.md) |
| 403       | Missing OAuth scope      | Add `w_member_social` in your LinkedIn app       |
| 422       | Bad request body         | Check URN format: `urn:li:person:XXXXX`          |
| 413       | File too large           | Images max 10MB, Videos max 200MB                |

---

## Limits

- Post text: max **3,000 characters**
- Images: max **10MB**, formats JPG/PNG
- Videos: max **200MB**, format MP4
- Rate limit: ~100 posts/day per user token
- For **company page** posts: use `urn:li:organization:XXXXX` as the URN and ensure `w_organization_social` scope is granted
