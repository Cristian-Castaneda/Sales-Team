---
name: marketing-genius
description: >
  Use this skill whenever the user wants to plan a marketing campaign, create a content strategy,
  research competitors, define the target audience, build messaging, generate content ideas,
  create a campaign brief, build a messaging house, or research the market.
  Trigger for: "plan a campaign", "research our audience", "create a content strategy",
  "what should we post about", "generate content ideas", "build a messaging house",
  "write a campaign brief", "research competitors", "define our ICP", "create 30 content ideas",
  "what's the strategy for", "build a campaign for", "research LATAM market",
  "what campaigns should we run", "create a content backlog".
  This is the orchestration brain — it never writes final copy or publishes. It produces briefs and directions
  that the copywriting, image-builder, and video-builder skills consume.
---

# Marketing Genius Skill

Strategic brain of the marketing team. Researches markets, defines audiences, builds campaigns,
creates messaging houses and content idea backlogs. Produces briefs for downstream skills.
Never publishes. Never invents facts.

## First-Time Setup

```bash
bash scripts/setup.sh
```

---

## Required Inputs

| Input            | Required | Description                                                        |
|------------------|----------|--------------------------------------------------------------------|
| `business_goal`  | Yes      | e.g. "book demos", "100 customers in 3 months", "increase SQLs"    |
| `region`         | Yes      | Target region (e.g. LATAM, Chile, México, Argentina)               |
| `audience`       | Yes      | Roles + company size (e.g. "Finance manager, 50-500 employees")    |
| `channels`       | Yes      | Available channels: linkedin / google_ads / email / blog / meta    |
| `budget_type`    | No       | organic / paid / both (default: organic)                           |
| `campaign_id`    | No       | Identifier for this campaign set (auto-generated if not provided)  |
| `competitors`    | No       | Comma-separated list (e.g. "RindeGastos,Tickelia,Expensify")       |
| `objections`     | No       | Known objections from leads (free text)                            |
| `past_results`   | No       | Notes from analytics (free text)                                   |

---

## Workflow

### Step 1 — Read product inputs

```bash
bun scripts/read-inputs.ts --type product
```

```bash
bun scripts/read-inputs.ts --type brand_kit
```

```bash
bun scripts/read-inputs.ts --type past_campaigns
```

Reads available workspace files. If not found, prints a warning and continues with provided context.

### Step 2 — Research (agent uses web_search)

Perform targeted web research:
- Audience: what finance/admin/ops teams in LATAM care about, pain points, vocabulary
- Competitors: positioning language, pricing cues, feature focus, weaknesses
- Market context: industry trends, regulatory context, tech adoption signals

Focus research on signals that differentiate from competitors and resonate with the audience pain.

### Step 3 — Build StoryBrand framework

Apply StoryBrand to each campaign:
- **Character**: the customer (role + company size + region)
- **Problem**: external (the task) + internal (the feeling) + philosophical (what's wrong)
- **Guide**: Expense-360 (with empathy + authority)
- **Plan**: 3 clear steps to success
- **CTA**: one clear next action
- **Success**: what life looks like after
- **Failure**: what's at stake without acting

### Step 4 — Generate campaign set (max 7)

Produce 3–7 focused campaigns. Each campaign must include:
- Name + ID
- Audience segment
- Primary pain
- Primary promise (outcome, not feature)
- StoryBrand one-liner
- Messaging pillars (3–5)
- Proof points needed
- CTA type
- Channel recommendations
- Content angles (examples)
- Assets needed (copy/image/video types)

### Step 5 — Save campaign artifacts

```bash
bun scripts/save-campaign.ts \
  --campaign-id "<campaign_id>" \
  --file "campaigns.md" \
  --content "<full_campaigns_content>"
```

```bash
bun scripts/save-campaign.ts \
  --campaign-id "<campaign_id>" \
  --file "campaigns.json" \
  --content "<structured_json>"
```

```bash
bun scripts/save-campaign.ts \
  --campaign-id "<campaign_id>" \
  --file "audience_insights.md" \
  --content "<research_findings>"
```

```bash
bun scripts/save-campaign.ts \
  --campaign-id "<campaign_id>" \
  --file "messaging_house.md" \
  --content "<taglines_pillars_objections>"
```

```bash
bun scripts/save-campaign.ts \
  --campaign-id "<campaign_id>" \
  --file "content_ideas.md" \
  --content "<30_to_50_ideas>"
```

```bash
bun scripts/save-campaign.ts \
  --campaign-id "<campaign_id>" \
  --file "handoff_notes.md" \
  --content "<directions_for_downstream_skills>"
```

### Step 6 — Report to user

- ✅ Campaign set created (N campaigns)
- 📁 Saved to `workspace/marketing/campaigns/<date>/<campaign_id>/`
- 🤝 Next steps: run copywriting skill / image-builder / video-builder with handoff_notes.md

---

## Review Gate (MANDATORY before delivering)

- [ ] Each campaign ties to a documented product value (not invented)
- [ ] No made-up metrics or performance claims
- [ ] Clear CTA that can be executed
- [ ] Channel fit is realistic (search intent vs LinkedIn awareness)
- [ ] Campaign set is focused (max 7, preferably 3–5)

---

## Error Reference

| Situation                    | Fix                                                   |
|------------------------------|-------------------------------------------------------|
| Product knowledge not found  | Run product-owner skill first, or provide context     |
| Brand kit not found          | Create `workspace/brand/brand_kit.md`                |
| No ICP defined               | Define audience in the prompt; save to `workspace/marketing/icp.md` after |

---

## Notes / Limits

- Max 7 campaigns per cycle (quality > quantity)
- Messaging house: 10–30 taglines, 10–20 one-liners, 3–5 pillars
- Content ideas: aim for 30–50, mapped to TOFU/MOFU/BOFU + channel + format
- Language for outputs: match the language of the target market (es for LATAM)
- StoryBrand is the primary framework; JTBD and objection-first are secondary lenses
