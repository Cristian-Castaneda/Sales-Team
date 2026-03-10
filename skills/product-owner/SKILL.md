---
name: product-owner
description: >
  Use this skill whenever the user asks about the product, wants to query product knowledge,
  needs product facts for another skill, or wants to update product documentation.
  Trigger for: "what does Expense-360 do", "what are our features", "what are our differentiators",
  "tell me about the product", "what's our ICP", "how does the approval flow work",
  "what's our pricing", "compare us to RindeGastos", "what objections do we handle",
  "update product knowledge", "add a feature to product owner", "update our differentiators",
  "product facts for the copy", "what integrations do we have", "how does OCR work",
  "what modules does Expense-360 have". This skill is the single source of truth for product facts.
  Never invents features, pricing, or claims. If not documented, says so.
---

# Product Owner Skill

Single source of truth for Expense-360 product knowledge. Answers product questions using only
documented facts. Updates product knowledge through an explicit, versioned protocol.
Never invents features, pricing, integrations, or claims.

## First-Time Setup

```bash
bash scripts/setup.sh
```

---

## Required Inputs

### For querying knowledge:

| Input      | Required | Description                                          |
|------------|----------|------------------------------------------------------|
| `question` | Yes      | Free-text product question from user or another skill |

### For updating knowledge:

| Input           | Required | Description                                               |
|-----------------|----------|-----------------------------------------------------------|
| `UPDATE_PRODUCT_OWNER: true` | Yes | Must be explicitly included in the request |
| `section`       | Yes      | Which section to update: Features / Differentiators / FAQ / Comparisons / Benefits / ICP |
| `content`       | Yes      | Exact content to add or replace                           |
| `change_note`   | Yes      | One-line description of what changed                      |

---

## Workflow

### Mode A — Query product knowledge

#### Step 1 — Read knowledge files

```bash
bun scripts/read-knowledge.ts
```

Reads all available product knowledge from workspace and prints it to stdout.

#### Step 2 — Answer the question

Answer ONLY from documented content. Apply 3-layer output:
1. **Plain explanation** — what it does / how it works
2. **Value translation** — why it matters to the customer
3. **Marketing-safe phrasing** — copy that's safe to use (no invented claims)

If not documented:
> "Not documented yet — please provide the details so I can update product knowledge."

---

### Mode B — Update product knowledge

#### Step 1 — Verify update request is complete

The request MUST include all of:
- `UPDATE_PRODUCT_OWNER: true` flag
- `section` name
- Exact content to add/change
- `change_note`

If any field is missing → treat as a query, not an update.

#### Step 2 — Read current knowledge

```bash
bun scripts/read-knowledge.ts
```

#### Step 3 — Apply the update

```bash
bun scripts/update-knowledge.ts \
  --section "<section_name>" \
  --content "<exact_content_to_add>" \
  --change-note "<what_changed>"
```

This script:
- Reads `skills/product-owner/product-features.md`
- Appends or replaces the specified section
- Increments the version number
- Adds a changelog entry
- Saves the updated file

#### Step 4 — Confirm to user

- ✅ Knowledge updated — section, version, change note
- 📁 Saved to `skills/product-owner/product-features.md`

---

## Review Gate (MANDATORY)

**For queries:**
- [ ] Answer is based solely on documented facts
- [ ] Nothing invented or assumed
- [ ] Undocumented items are flagged explicitly

**For updates:**
- [ ] `UPDATE_PRODUCT_OWNER: true` was present in the request
- [ ] Change matches exactly what was requested
- [ ] Version was incremented
- [ ] Changelog entry was added

---

## Error Reference

| Situation                     | Fix                                                         |
|-------------------------------|-------------------------------------------------------------|
| Knowledge file not found      | Run `update-knowledge.ts --init` to create the file         |
| Section not found             | Check available sections with `read-knowledge.ts --sections` |
| Update flag missing           | Remind user to include `UPDATE_PRODUCT_OWNER: true`         |

---

## Notes / Limits

- Core principle: **no guessing, no hallucinations**
- If something is not in the knowledge file → say so explicitly
- Comparisons to competitors only from documented data
- The knowledge file lives at `skills/product-owner/product-features.md`
- Version format: `major.minor.patch` (bump patch for additions, minor for restructuring)
