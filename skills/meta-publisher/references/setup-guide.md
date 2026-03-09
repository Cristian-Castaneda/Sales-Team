# Meta Publisher — Setup Guide

## Overview

This skill publishes organic content to **Facebook Pages** and **Instagram Business** accounts
using the Meta Graph API. It requires:
- A **Page Access Token** (long-lived or short-lived)
- Your **Facebook Page ID**
- Your **Instagram Business User ID**

---

## Step 1 — Create a Meta Developer App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Business** type
4. Fill in app name and contact email
5. Click **Create App**

---

## Step 2 — Add required products and permissions

In your app dashboard, add:

### Facebook Login
- Under **Use Cases**, add "Post content to Facebook pages"
- Permissions needed:
  - `pages_manage_posts` — create/publish posts on pages
  - `pages_read_engagement` — read page data

### Instagram Basic Display / Instagram API
- Under **Use Cases**, add "Publish content to Instagram"
- Permissions needed:
  - `instagram_content_publish` — create and publish IG posts
  - `instagram_basic` — basic IG account access

---

## Step 3 — Generate a Page Access Token

### Option A — Graph API Explorer (testing)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app and your Facebook Page
3. Add permissions: `pages_manage_posts`, `instagram_content_publish`
4. Click **Generate Access Token**
5. Copy the short-lived token

**Convert to long-lived token (60 days):**
```bash
curl -X GET "https://graph.facebook.com/v21.0/oauth/access_token" \
  -d grant_type=fb_exchange_token \
  -d client_id=YOUR_APP_ID \
  -d client_secret=YOUR_APP_SECRET \
  -d fb_exchange_token=SHORT_LIVED_TOKEN
```

**Get never-expiring Page token from long-lived user token:**
```bash
curl -X GET "https://graph.facebook.com/v21.0/me/accounts" \
  -d access_token=LONG_LIVED_USER_TOKEN
```
Look for your page in the results — the `access_token` field is the Page Access Token (never expires unless revoked).

### Option B — OAuth flow (production)

Implement standard OAuth 2.0 to request tokens from page admins programmatically.

---

## Step 4 — Find your Facebook Page ID

```bash
curl "https://graph.facebook.com/v21.0/me/accounts?access_token=YOUR_USER_TOKEN"
```

Response includes your pages with their `id` fields. Copy your page `id`.

---

## Step 5 — Find your Instagram Business User ID

Your Facebook Page must be connected to an Instagram Business account.

```bash
curl "https://graph.facebook.com/v21.0/YOUR_PAGE_ID?fields=instagram_business_account&access_token=YOUR_PAGE_TOKEN"
```

The `instagram_business_account.id` is your IG User ID.

---

## Step 6 — Set environment variables on VPS

Add to your `.env` file (never commit this):
```bash
META_ACCESS_TOKEN=your_page_access_token_here
FB_PAGE_ID=your_facebook_page_id
IG_USER_ID=your_instagram_business_user_id
```

Or export in the shell:
```bash
export META_ACCESS_TOKEN="your_token"
export FB_PAGE_ID="12345678"
export IG_USER_ID="17841400000000"
```

---

## Step 7 — Verify setup

```bash
# Check Page info:
curl "https://graph.facebook.com/v21.0/$FB_PAGE_ID?fields=name,id&access_token=$META_ACCESS_TOKEN"

# Check IG account:
curl "https://graph.facebook.com/v21.0/$IG_USER_ID?fields=name,username&access_token=$META_ACCESS_TOKEN"
```

Both should return your page/account info. If 403 → check token permissions.

---

## Troubleshooting

| Error Code | Meaning                        | Fix                                                           |
|------------|--------------------------------|---------------------------------------------------------------|
| 190        | Token expired/invalid          | Regenerate Page Access Token                                  |
| 10         | Permission denied              | Add `pages_manage_posts` and `instagram_content_publish`     |
| 100        | Invalid parameter              | Check Page ID / IG User ID                                    |
| 200        | OAuthException                 | Token may lack required scopes                                |
| 368        | Content policy violation       | Review caption and media — remove policy-triggering content  |

---

## Instagram Media URL Requirement

Instagram's Graph API requires **public URLs** for media uploads — local file paths are not accepted.
Options:
1. Upload to a CDN or cloud storage (S3, GCS, etc.) and use the public URL
2. Use a temporary signed URL that expires after upload
3. Self-host on your VPS with a public-facing URL

For testing, you can use free services like Imgur or Cloudinary to host the image and get a URL.
