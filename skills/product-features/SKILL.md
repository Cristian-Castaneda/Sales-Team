---
name: product-features
description: >
  Use this skill whenever anyone asks a question about Expense-360: what it does, how a feature
  works, what modules exist, how the approval flow works, how WhatsApp submission works, what
  Caja Chica is, what Fondos por Rendir is, how multi-company works, what Unidades de Negocio
  or Centros de Costo are, how OCR works, what the pricing is, what plans exist, how we compare
  to RindeGastos or Expensify, who the product is for, what LATAM markets are supported,
  what integrations exist, what roles exist in the platform, or any other product-related question.
  Trigger for: "how does X work", "what is X", "does the app support X", "what plan includes X",
  "how much does it cost", "what's the difference between us and RindeGastos", "explain the
  approval flow", "what is Caja Chica", "can I submit from WhatsApp", "what currencies are supported",
  "how does multi-company work", "what roles does the platform have", "what modules does Expense-360 have".
  Answers from the embedded product.md only. Never invents features, pricing, or claims.
---

# Product Features Skill

Answers any question about Expense-360 using only the facts documented in `product.md`,
which lives in this skill folder. Never invents features, integrations, pricing, or claims.
If something is not documented, says so explicitly and asks the user to provide the correct info.

---

## Workflow

### Step 1 — Read the product knowledge file

Read the file at:

```
skills/product-features/product.md
```

This file contains the complete, official product knowledge for Expense-360.
It is the only source of truth. Do not use external knowledge or assumptions.

### Step 2 — Answer the question

Answer using only what is documented in `product.md`. Apply this output structure:

1. **Direct answer** — answer the question clearly and concisely
2. **How it works** — explain the mechanism or flow if relevant
3. **Why it matters** — the value this delivers to the customer (only if helpful)

If the answer is not in `product.md`:
> "That's not documented yet. Please provide the correct information and I'll note it."

### Step 3 — Updating the knowledge (if user provides new info)

If the user says something like "actually, X works differently" or "add this feature":

1. Confirm the new information with the user
2. Tell the user exactly what you would update in `product.md`
3. Ask them to confirm before treating it as official

---

## Review Gate (MANDATORY before answering)

- [ ] Answer comes exclusively from `product.md` — nothing invented
- [ ] No competitor claims that are not explicitly documented
- [ ] No pricing numbers that differ from what is in `product.md`
- [ ] Undocumented items are flagged, not guessed

---

## Notes / Limits

- Single source of truth: `skills/product-features/product.md`
- If `product.md` is missing or unreadable → inform the user immediately
- Default response language: Spanish (es) unless the question was asked in English
- Never use external knowledge to fill gaps — only documented facts
