---
name: linkedin-org-publisher
description: >
  Use this skill whenever the user wants to post, publish, draft, or schedule organic content
  on a LinkedIn Company Page (organization page). Different from personal LinkedIn posts.
  Trigger for: "post to our LinkedIn page", "publish to LinkedIn company page", "draft a LinkedIn
  company post", "post as Expense-360 on LinkedIn", "create a LinkedIn org post", "schedule a post
  on the LinkedIn page", "publish the LinkedIn content", "send this to LinkedIn page",
  "post this image to LinkedIn company", "create LinkedIn page draft", "validate LinkedIn post",
  "post video to LinkedIn page". Handles text-only, image, and video posts for company pages.
  Always creates a draft or local bundle first — never publishes without explicit approval.
---

# LinkedIn Org Publisher Skill

Publish organic content to a LinkedIn **Company Page** safely.
Always validates content first, creates a draft (browser UI preferred) or local bundle,
and requires explicit approval before any API publish action.

## First-Time Setup

```bash
bash scripts/setup.sh
```

See `references/setup-guide.md` for OAuth token and org URN setup.

---

## Required Inputs

| Input         | Required | Description                                                              |
|---------------|----------|--------------------------------------------------------------------------|
| `post_text`   | Yes      | Final post text (max 3 000 chars)                                        |
| `job_id`      | Yes      | Unique job identifier                                                    |
| `post_type`   | Yes      | text_only / image / video                                                |
| `language`    | No       | es / en / pt (default: es)                                               |
| `media_path`  | No       | Absolute workspace path to image (JPG/PNG) or video (MP4)                |
| `hashtags`    | No       | Space-separated hashtags (e.g. "#fintech #latam")                        |
| `link_url`    | No       | Optional link to include                                                 |
| `copyright`   | No       | Attribution appended as `\n\n© {text}`                                   |

Store secrets as environment variables on the VPS:
```bash
export LINKEDIN_ORG_ACCESS_TOKEN="your_token_here"
export LINKEDIN_ORG_URN="urn:li:organization:XXXXXXXX"
```

---

## Workflow

### Step 1 — Validate content

```bash
bun scripts/validate-post.ts \
  --job-id "<job_id>" \
  --text "<post_text>" \
  --type "<post_type>" \
  --media-path "<absolute_path_or_empty>"
```

Checks:
- Text length ≤ 3 000 characters
- No risky/unverified claims detected
- Hashtags count is reasonable (≤ 5)
- Media exists and has correct format (JPG/PNG ≤ 10MB, MP4 ≤ 200MB)

If validation fails → prints specific issues → **STOP, do not continue**.

### Step 2 — Save validated bundle to workspace

```bash
bun scripts/save-bundle.ts \
  --job-id "<job_id>" \
  --text "<validated_post_text>" \
  --type "<post_type>" \
  --media-path "<path_or_empty>" \
  --hashtags "<hashtags>"
```

Saves `workspace/social/linkedin/<date>/<job_id>/validated_post.md` and assets.

### Step 3 — Upload media (skip for text-only)

```bash
bun scripts/upload-media.ts \
  --token "$LINKEDIN_ORG_ACCESS_TOKEN" \
  --urn "$LINKEDIN_ORG_URN" \
  --file "<absolute_media_path>" \
  --type image
```

Prints `ASSET_URN=urn:li:digitalmediaAsset:XXXXX` — capture this value.

### Step 4 — Create post (REQUIRES EXPLICIT APPROVAL)

⚠️ **Only run this step after the user has approved the bundle.**

Present the approval prompt first:
```
🟡 Bundle ready for review:
   Job: <job_id>
   Type: <post_type>
   Text: "<first 200 chars>..."
   Media: <filename or "none">

Reply APPROVE <job_id> to publish via API.
```

After receiving `APPROVE <job_id>`:

```bash
# Text-only
bun scripts/create-post.ts \
  --token "$LINKEDIN_ORG_ACCESS_TOKEN" \
  --urn "$LINKEDIN_ORG_URN" \
  --job-id "<job_id>"

# With media
bun scripts/create-post.ts \
  --token "$LINKEDIN_ORG_ACCESS_TOKEN" \
  --urn "$LINKEDIN_ORG_URN" \
  --job-id "<job_id>" \
  --asset "urn:li:digitalmediaAsset:XXXXX"
```

### Step 5 — Report to user

- ✅ Published successfully
- 🔗 Post URL (printed by script)
- 📁 Bundle saved at `workspace/social/linkedin/<date>/<job_id>/`
- ⏳ If video: note processing may take a few minutes

---

## Review Gate (MANDATORY before any publish)

- [ ] Text is readable and not over-hashtagged (≤ 5 hashtags)
- [ ] No risky, unverified, or policy-triggering claims
- [ ] Media is correct orientation and within size limits
- [ ] Post matches campaign direction and brand voice
- [ ] Explicit approval received (`APPROVE <job_id>`)

---

## Error Reference

| HTTP Code | Meaning                  | Fix                                               |
|-----------|--------------------------|---------------------------------------------------|
| 401       | Token expired            | Re-generate token (see references/setup-guide.md) |
| 403       | Missing OAuth scope      | Add `w_organization_social` to your LinkedIn app  |
| 422       | Bad request body         | Check org URN: `urn:li:organization:XXXXXXXX`     |
| 413       | File too large           | Images max 10MB, Videos max 200MB                 |
| 429       | Rate limit               | Wait and retry (max ~100 posts/day per token)     |

---

## Notes / Limits

- This skill is for **Company Page** posts only (not personal profile)
- Required OAuth scope: `w_organization_social` (not `w_member_social`)
- Org URN format: `urn:li:organization:XXXXXXXX`
- Post text: max **3 000 characters** (enforced by validator)
- LinkedIn does not reliably support draft creation via API — approval gate replaces UI drafts
- For video posts: processing takes 2–10 min after publish; post will be live but video may show placeholder
