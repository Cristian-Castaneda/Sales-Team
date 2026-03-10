# Expense-360 — Product Knowledge Base

**Version:** 1.0.0
**Last updated:** 2026-03-10
**Maintained by:** product-owner skill

---

## Changelog

| Version | Date       | Change                                |
|---------|------------|---------------------------------------|
| 1.0.0   | 2026-03-10 | Initial knowledge base — full product loaded from RFP v1.0 |

---

## Product Overview

**Product name:** Expense-360
**Category:** Corporate expense management SaaS
**Primary market:** Small-to-mid-sized companies in Latin America (LATAM)
**Default language:** Spanish (es)
**Billing model:** SaaS subscription — Basic / Pro / Enterprise tiers, with a free trial period

Expense-360 replaces fragmented, manual corporate expense workflows with a structured, multi-tenant
platform that handles the full expense lifecycle: submission, approval routing, fund disbursement,
and reporting — accessible from both a web application and WhatsApp.

---

## The Problem We Solve

Companies in LATAM face three core pain points in expense management:

1. **Submissions are unstructured** — employees send receipt photos via WhatsApp or email with no
   standardization, no categorization, and no reference numbers.

2. **Approval processes are manual** — finance teams chase approvals through chat, with no audit
   trail, no accountability, and no visibility into bottlenecks.

3. **Reimbursement is slow and opaque** — disbursement tracking happens in spreadsheets; employees
   have no visibility into when or whether they will be paid.

Expense-360 solves all three with a structured digital workflow, automatic OCR receipt extraction,
role-based approval chains, and WhatsApp-native submission so employees don't need to learn a new app.

---

## Features

### Core Web Application

- **Expense submission** — create expense reports with amount, category, date, description, and
  receipt attachment (image or PDF)
- **Approval workflow** — multi-step routing based on expense type, amount thresholds, and
  organizational structure; email notifications on every status change
- **Expense status tracking** — full lifecycle visibility: Draft → Submitted → Approved → Paid / Rejected
- **Caja Chica (Petty Cash)** — dedicated module to create a petty cash fund, record transactions,
  close and liquidate with supporting receipts. LATAM-native concept built into the platform.
- **Fondos por Rendir (Cash Advances)** — issue advances to employees, track usage, receive
  settlement with receipts. Full reconciliation workflow.
- **Supplier registry** — vendor CRUD with name, tax ID (RUT/RFC/CUIT), and bank details
- **Dashboard & KPIs** — expense totals by period, status breakdown, top categories, top spenders,
  cost center analysis
- **XLSX export** — export expense data to Excel for accounting teams
- **PDF report generation** — formatted expense report PDF for accounting submission
- **Google Maps integration** — optional location tag per expense for field teams
- **QR code generation** — generate QR per expense report for physical submission workflows
- **Audit log** — every consequential action (approval, rejection, payment, role change) is
  timestamped and attributed to the actor

### WhatsApp Submission Channel

Employees submit expenses directly via WhatsApp without logging into the web app.
Connected to a dedicated WhatsApp Business number via the Meta WhatsApp Cloud API (direct
integration — no third-party BSP middleware like Twilio or 360dialog).

Conversational flow:
1. Employee messages the WhatsApp number
2. Bot greets and asks: what type of expense?
3. Bot asks for the amount
4. Bot asks for the expense category
5. Bot asks employee to send a photo of the receipt
6. Bot confirms details and submits to the platform
7. Employee receives confirmation with a reference number

Session state persists across messages. WhatsApp phone number is linked to the employee's
account so submitted expenses are automatically attributed to the right person.

### OCR — Document Processing Pipeline

When a receipt or invoice is uploaded (web or WhatsApp), the system automatically extracts
structured data using **Google Cloud Document AI**.

- Accepts JPG, PNG, and PDF
- Extracts: total amount, date, vendor name, tax amount/type
- Pre-populates the expense form with extracted data for user confirmation
- If confidence is below threshold → flags for manual entry (no silent errors)
- Stores original documents in tenant-scoped cloud storage with signed URL access
- Falls back gracefully to manual entry when extraction fails

### AI Marketing Assistant

A conversational AI assistant powered by the **Anthropic Claude API**, deployed on two channels:
1. Embedded chat widget on the product landing page (Vue component, mobile-responsive)
2. Dedicated WhatsApp Business number for marketing inquiries (separate from expense submission number)

Capabilities:
- Answers questions about the product, pricing, and features
- Retrieval-Augmented Generation (RAG) — semantic + keyword search for contextually relevant answers
- Conversation history and memory persists across sessions
- Identifies returning users across sessions and channels
- Lead capture — collects name, email, company from interested prospects

### Multi-Tenancy & Role-Based Access Control

Supports multiple companies (tenants) fully isolated from one another on a single infrastructure.
Data partitioning enforced at database and application layer — no cross-tenant data leakage.

Four roles per tenant:

| Role           | Responsibilities                                                               |
|----------------|--------------------------------------------------------------------------------|
| Rendidor       | Submits expense reports, uploads receipts                                      |
| Aprobador      | Reviews and approves or rejects submitted expenses                             |
| Pagador        | Confirms disbursement, marks expenses as paid                                  |
| Administrador  | Full access: user management, settings, reporting, billing                     |

Additional access control:
- User invite flow (admin invites by email; invited users complete registration)
- Pending users queue for new registrations without tenant assignment
- Area-based permissions (optionally restrict users to specific cost centers)

### Billing & Subscriptions

Three SaaS tiers: **Basic**, **Pro**, **Enterprise**

- Free trial period for new tenants
- Subscription creation, upgrade, downgrade, cancellation
- Automated account suspension on non-payment
- Billing portal for administrators (plan management, payment method, invoice history)
- Payment providers:
  - **Dodo Payments** (primary, global)
  - **MercadoPago** (secondary, Chilean and broader LATAM market)

---

## Differentiators

### 1. WhatsApp-native submission
Employees submit expenses without downloading an app or logging into a dashboard.
They use WhatsApp — the app they already have open all day. This is not a link to a form.
It is a structured, guided bot conversation that collects every required field and submits
directly to the platform. Adoption is dramatically higher than any web-only tool.

### 2. Direct Meta Cloud API — no BSP middleware
Most WhatsApp-enabled tools route through a BSP (Twilio, 360dialog, Vonage).
Expense-360 connects directly to the Meta WhatsApp Cloud API (graph.facebook.com).
No intermediary, no extra cost per message, no dependency on a third-party relay.

### 3. Automatic OCR — receipt data extraction
Google Cloud Document AI reads the receipt and fills in the form automatically.
Employees don't type amounts or dates. Finance teams don't re-enter data.
Errors from manual transcription are eliminated at the source.

### 4. LATAM-native modules
Caja Chica and Fondos por Rendir are concepts that exist only in LATAM accounting workflows.
No US-built tool handles them natively. Expense-360 was designed from day one around LATAM
financial operations, not ported from a global product with patches added.

### 5. Full audit trail
Every action in the platform — submission, approval, rejection, payment confirmation, role change —
is logged with timestamp, actor identity, and context. Finance teams have complete traceability
for audits, compliance, and dispute resolution.

### 6. AI assistant with RAG
The landing page and WhatsApp marketing channel use a Claude-powered assistant that retrieves
relevant product knowledge before answering. Not a generic chatbot — a product-expert that
never guesses and can qualify leads 24/7.

### 7. Tenant isolation by design
Architecture-level isolation: each company's data lives in separate Firestore root collections.
Security rules enforce isolation at the database layer, not just the application layer.
No configuration error can cause cross-tenant data exposure.

---

## Benefits

### For the Rendidor (employee)
- Submit expenses in seconds from WhatsApp — no app to download
- Know exactly what stage your expense is in at all times
- Stop losing paper receipts — the app stores everything in the cloud
- Get reimbursed faster because approval loops no longer depend on someone remembering to check email

### For the Aprobador (manager)
- Review and approve from anywhere, on any device
- See all pending approvals in one dashboard — no hunting through WhatsApp threads
- Full context per expense: receipt, category, amount, employee history
- Clear audit trail if anything needs to be revisited

### For the Pagador (finance/treasury)
- One place to see everything that has been approved and needs to be paid
- Mark payments as done with a click — no spreadsheet updates
- Caja Chica and Fondos por Rendir modules eliminate the most common reconciliation headaches
- Export to XLSX or PDF for accounting and ERP integration

### For the Administrador (CFO / Finance Director)
- Real-time dashboard: where is the money going, by whom, by category, by cost center
- Role-based access means only the right people see the right data
- Vendor registry with full payment details — no more chasing bank accounts
- Subscription management self-service — no support tickets to change plans

---

## ICP (Ideal Customer Profile)

### Primary ICP
- **Company type:** SMB and mid-market companies
- **Employee count:** 20–500 employees
- **Geography:** Chile (primary), México, Argentina, Colombia, Perú (secondary)
- **Industry:** Any company with field employees, sales teams, or distributed operations:
  construction, logistics, retail chains, professional services, NGOs
- **Current pain:** Managing expenses via WhatsApp groups, shared email, or Excel spreadsheets
- **Key buyer roles:** CFO, Finance Manager, General Manager, Operations Manager
- **Key influencer roles:** Finance team members who process expenses manually today
- **Budget signal:** Currently paying for tools that don't talk to each other (G-Suite, WhatsApp,
  a local accounting tool, and a spreadsheet)
- **Trigger events:** Company growing past 20 employees; recent audit finding; new finance hire;
  frustrated CEO after a reimbursement dispute

### Secondary ICP
- **Larger companies** (500–2,000 employees) with decentralized expense management across offices
- **Companies currently using Expensify** or RindeGastos frustrated by lack of WhatsApp integration
  or LATAM-specific modules

---

## Comparisons

### vs. RindeGastos
- RindeGastos is web and mobile-first; no WhatsApp-native submission flow
- RindeGastos does not have native Fondos por Rendir or Caja Chica as dedicated modules
- Expense-360 has direct Meta API integration; RindeGastos routes through BSPs if WhatsApp exists at all
- Expense-360 OCR auto-fills forms; reduces manual data entry at submission time

### vs. Tickelia
- Tickelia is primarily a Spanish/European tool, not LATAM-native
- Currency, tax handling, and role vocabulary are designed for Spain (not Chile/Mexico/Argentina)
- Expense-360 supports MercadoPago natively for LATAM payment workflows
- Tickelia has no WhatsApp submission channel

### vs. Expensify
- Expensify is a global US product with no WhatsApp channel
- No LATAM-specific modules (Caja Chica, Fondos por Rendir do not exist)
- Expensify pricing is in USD, often expensive for LATAM SMBs
- Expense-360 is built for LATAM compliance vocabulary and workflows from the ground up
- Expensify has no MercadoPago integration

---

## FAQ

**Q: Does the employee need to download an app?**
A: No. Expense submission via WhatsApp requires zero app downloads. The employee uses the WhatsApp
they already have. The web app is available for employees who prefer it, but is not required.

**Q: How does the OCR work?**
A: The employee takes a photo of the receipt and sends it via WhatsApp (or uploads via web).
Google Cloud Document AI processes it and extracts amount, date, vendor name, and tax fields.
This data pre-fills the expense form. The employee confirms and submits. No manual typing needed.

**Q: Is company data isolated from other companies?**
A: Yes. Multi-tenant isolation is enforced at the database and application layer. No company can
see, access, or affect another company's data under any conditions.

**Q: What happens if the OCR can't read a receipt?**
A: The system falls back gracefully to a manual entry form. The employee fills in the fields
manually. No expense is lost due to poor image quality.

**Q: What is Caja Chica?**
A: A petty cash fund managed within the platform. The administrator creates a fund, records
transactions against it, and closes/liquidates it with receipts. Common in LATAM accounting workflows.

**Q: What is Fondos por Rendir?**
A: A cash advance issued to an employee (for a trip, project, etc.) that must be settled with
receipts after the fact. The platform tracks the advance, receives the settlement, and reconciles.

**Q: Which payment methods are supported?**
A: Dodo Payments (primary, global card and bank transfer) and MercadoPago (secondary, Chilean and
broader LATAM market including local payment methods).

**Q: What countries in LATAM are supported?**
A: The platform is built for all LATAM markets. Chile is the primary launch market (MercadoPago
integration, CLP currency). México, Argentina, Colombia, and Perú are actively targeted.

**Q: Can we integrate with our accounting system?**
A: Expense reports can be exported as XLSX and PDF for import into any accounting tool. Direct
ERP integrations are on the product roadmap.

**Q: Is there a free trial?**
A: Yes. New tenant accounts get a free trial period before being required to subscribe to a paid plan.

---

## Tech Stack (for credibility / technical audiences)

| Layer          | Technology                                          |
|----------------|-----------------------------------------------------|
| Frontend       | Vue 3 + Composition API + Pinia + Vuetify 3         |
| Landing page   | Nuxt 3 + Tailwind CSS + GSAP + Lottie               |
| Backend        | Node.js on Firebase Cloud Functions (serverless)    |
| Database       | Google Firestore (NoSQL, real-time, multi-tenant)   |
| File storage   | Firebase Storage / Google Cloud Storage             |
| Auth           | Firebase Authentication                             |
| OCR            | Google Cloud Document AI                            |
| AI assistant   | Anthropic Claude API + RAG                          |
| WhatsApp       | Meta WhatsApp Cloud API (direct — no BSP)           |
| Payments       | Dodo Payments + MercadoPago                         |
| Email          | Resend API                                          |
| Hosting        | Firebase Hosting + Google Cloud Platform            |

---

## LATAM Market Context (for marketing-genius)

- WhatsApp penetration in LATAM is 90%+ — it is the primary business communication tool,
  not a secondary channel. Employees and managers already run approvals informally via WhatsApp.
  Meeting them there eliminates adoption resistance.
- Most LATAM SMBs use a combination of WhatsApp groups, shared email inboxes, and Excel for
  internal finance operations. The digital transformation gap is significant and the pain is real.
- Finance teams in LATAM are typically understaffed relative to the volume of manual work.
  Automation of receipt capture and approval routing has immediate, tangible ROI.
- MercadoPago is the dominant payment infrastructure in Chile and Argentina. Integrating it
  natively signals that the product was built for this market, not adapted from a US tool.
- Caja Chica and Fondos por Rendir are legal/accounting obligations in most LATAM countries —
  not optional workflows. Any competitor that ignores them loses credibility with finance buyers.
- Language is non-negotiable: all customer-facing content must be in Spanish. Finance managers
  in Chile, México, and Argentina do not want to read English-language SaaS copy.

---

## Brand Voice Guidelines (for copywriting skill)

- **Direct and confident** — we know the problem, we know we solve it. No hedging.
- **LATAM-native** — speak like a finance manager in Santiago or Mexico City, not like a translated
  US product. Use the vocabulary they use: Rendidor, Aprobador, Pagador, Caja Chica.
- **Problem-first** — lead with the pain before the solution. The prospect knows their spreadsheet
  is broken before they know we exist.
- **No tech jargon in customer content** — OCR becomes "escaneo automático de boletas";
  multi-tenancy becomes "tu empresa, tus datos, sin mezclas".
- **WhatsApp as proof of practicality** — lead with WhatsApp submission as the killer feature
  in awareness content. It is the fastest way to make the value visceral.
- **Tone**: professional but not corporate. We are a LATAM startup solving a real problem for
  real finance teams. Warm, direct, confident.

---

## Content Pillars (for marketing-genius and copywriting)

1. **Pain** — The chaos of managing expenses over WhatsApp groups and spreadsheets
2. **Education** — How structured expense management works; what Caja Chica/Fondos por Rendir
   compliance looks like; why approval trails matter for audits
3. **Product stories** — Feature walkthroughs, before/after scenarios, specific workflow demos
4. **Social proof** — Customer stories, use cases, results (populate as data becomes available)
5. **LATAM identity** — We are built for this market. Caja Chica. MercadoPago. Spanish-first.
   WhatsApp-native. Not a US tool with a translation layer.

---

## Objection Handling

| Objection                              | Response                                                                                    |
|----------------------------------------|---------------------------------------------------------------------------------------------|
| "We already manage with WhatsApp/Excel" | That's exactly the problem we solve. Expense-360 gives structure to what you already do, without forcing employees to learn a new app. |
| "It's too expensive for our size"      | We have a free trial and plans starting at SMB size. Calculate the hours your finance team spends chasing receipts and approvals — the math flips fast. |
| "We use [competitor]"                  | Ask if they have WhatsApp-native submission, Caja Chica, Fondos por Rendir, and MercadoPago. If not, they built it for a different market. |
| "Our employees won't adopt a new tool" | They don't need to. They submit via WhatsApp. Zero app download, zero new login. Finance teams get the structured dashboard. |
| "We're worried about data security"    | Each company's data is completely isolated at the database level — enforced by Firebase Security Rules, not just app logic. |
| "We need ERP integration"              | XLSX and PDF export work with any accounting tool today. Direct ERP integrations are on the roadmap. |
