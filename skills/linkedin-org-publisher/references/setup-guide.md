# LinkedIn Org Publisher — Setup Guide

## Overview

This skill posts to a LinkedIn **Company Page** (not a personal profile).
It requires an OAuth token with `w_organization_social` scope and the organization's URN.

---

## Step 1 — Create a LinkedIn Developer App

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click **Create app**
3. Fill in:
   - App name: `Expense-360` (or your choice)
   - LinkedIn Page: select your company page
   - App logo: upload any logo
4. Click **Create app**

---

## Step 2 — Enable the correct OAuth scopes

In your app → **Auth** tab → **OAuth 2.0 scopes**, add:

| Scope                   | Purpose                              |
|-------------------------|--------------------------------------|
| `w_organization_social` | Create posts on company pages        |
| `r_organization_social` | Read company page post analytics     |

> ⚠️ These are **different** from `w_member_social` (personal posts). You need organization scopes.

---

## Step 3 — Generate an OAuth Access Token

### Option A — Manual (quick for testing)

1. In your app → **Auth** → **OAuth 2.0 tools**
2. Select scopes: `w_organization_social`, `r_organization_social`
3. Click **Request access token**
4. Copy the token

**Note:** Manual tokens expire in 60 days.

### Option B — 3-legged OAuth (production)

1. Redirect the page admin to:
   ```
   https://www.linkedin.com/oauth/v2/authorization
     ?response_type=code
     &client_id=YOUR_CLIENT_ID
     &redirect_uri=YOUR_REDIRECT_URI
     &scope=w_organization_social%20r_organization_social
   ```
2. Exchange the code for an access token:
   ```bash
   curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
     -d grant_type=authorization_code \
     -d code=AUTH_CODE \
     -d redirect_uri=YOUR_REDIRECT_URI \
     -d client_id=YOUR_CLIENT_ID \
     -d client_secret=YOUR_CLIENT_SECRET
   ```
3. Store the `access_token` from the response.

---

## Step 4 — Find your Organization URN

Option A — LinkedIn API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR"
```
Look for `organization` field → value is `urn:li:organization:XXXXXXXX`.

Option B — From the page URL:
- Go to your company page admin section → Settings → scroll for "Company Page ID"
- Format: `urn:li:organization:<ID>`

---

## Step 5 — Set environment variables on VPS

Add to your `.env` file (never commit this):
```bash
LINKEDIN_ORG_ACCESS_TOKEN=your_access_token_here
LINKEDIN_ORG_URN=urn:li:organization:XXXXXXXX
```

Or export in the shell session:
```bash
export LINKEDIN_ORG_ACCESS_TOKEN="your_token"
export LINKEDIN_ORG_URN="urn:li:organization:XXXXXXXX"
```

---

## Troubleshooting

| Error | Meaning | Fix |
|-------|---------|-----|
| 401   | Token expired or invalid | Re-generate token via OAuth flow |
| 403   | Missing scope or not admin | Add `w_organization_social`; verify page admin role |
| 422   | Malformed request | Check org URN format: must start with `urn:li:organization:` |
| 429   | Rate limited | Wait a few minutes; limit is ~100 posts/day per token |

---

## Token Refresh

LinkedIn access tokens expire. For production, implement refresh token rotation or use a service account with long-lived tokens. Store tokens securely in the `.env` file — never in code or logs.
