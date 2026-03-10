# Expense-360 — Official Product Reference

> This file is the single source of truth for the product-features skill.
> Last updated: 2026-03-10 | Version: 1.1.0

---

## What Is Expense-360

Expense-360 is a corporate expense management SaaS built for small and mid-sized companies
in Latin America. It replaces the fragmented mix of WhatsApp groups, email threads, and
spreadsheets that most LATAM companies use to manage employee expenses.

It handles the full expense lifecycle: submission → approval → disbursement → reporting.
Accessible from a web app and directly from WhatsApp — no extra app required.

**Market:** LATAM (primary: Chile; also México, Argentina, Colombia, Perú)
**Language:** Spanish-first
**Current customers:** ~100 companies, ~800 active users (avg 8 users/company)

---

## Pricing

| Plan       | Price              | Best for                                    |
|------------|--------------------|---------------------------------------------|
| Basic      | $3 USD/user/month  | Small teams, basic expense workflows        |
| Pro        | $6 USD/user/month  | Growing companies with complex approvals    |
| Enterprise | $7 USD/user/month  | Large or multi-company organizations        |

- Free trial available for all new accounts
- Per-user pricing: scales with the company
- Payment methods: Dodo Payments (global) + MercadoPago (Chile and LATAM)

---

## The Three Problems We Solve

1. **Unstructured submissions** — employees send receipt photos via WhatsApp or email with no
   standardization, no categorization, and no reference number.

2. **Manual approvals** — finance teams chase approvals through chat with no audit trail
   and no visibility into where an expense is stuck.

3. **Slow, opaque reimbursement** — disbursement is tracked in spreadsheets; employees
   have no idea when they will get paid.

---

## Modules & Features

### Expense Submission (Web)
- Create expense with amount, category, date, description, receipt attachment
- Upload image (JPG, PNG) or PDF — OCR auto-extracts the data
- Full status tracking: Draft → Submitted → Approved → Paid / Rejected

### WhatsApp Submission
- Employees submit expenses directly from WhatsApp — zero app download, zero new login
- Connected via Meta WhatsApp Cloud API (direct — no BSP middleware like Twilio)
- Guided conversational flow: expense type → amount → category → receipt photo → confirmation
- Employee receives a reference number on submission
- WhatsApp phone number is linked to the employee account — expenses are auto-attributed

### Approval Workflow
- Multi-step routing based on expense type, amount thresholds, and org structure
- Email notifications on every status change
- Full visibility into where each expense is in the approval chain
- Approver reviews with full context: receipt, amount, category, employee history

### Caja Chica (Petty Cash)
- Dedicated module for petty cash funds
- Create fund → record transactions → close and liquidate with supporting receipts
- Built for the LATAM accounting concept — not a workaround, a native module

### Fondos por Rendir (Cash Advances)
- Issue a cash advance to an employee (for a trip, project, etc.)
- Track advance usage
- Receive settlement with receipts
- Full reconciliation workflow
- Built natively for LATAM — not available in US-built tools

### Multi-Company System
- One user account linked to multiple companies (empresas)
- Fast company switcher in the UI — no re-authentication
- Complete data isolation between companies — switching never exposes another company's data
- User can have a different role in each company
  (e.g. Administrador in Company A, Rendidor in Company B)
- Designed for: accounting firms, consultants, holding groups, shared-services orgs

### Workspaces — Unidades de Negocio & Centros de Costo
- **Unidad de Negocio:** group expenses by business division (e.g. Retail, Obras, Servicios)
- **Centro de Costo:** tag expenses to accounting cost centers
- **Multi-currency:** each workspace runs in its own currency (CLP, USD, MXN, etc.)
- Dashboards and reports filter by business unit and cost center
- Finance teams can set budgets at the cost center level

### OCR — Automatic Receipt Reading
- Powered by Google Cloud Document AI
- Extracts: total amount, date, vendor name, tax amount/type
- Pre-fills the expense form — employee confirms, not re-types
- Accepts JPG, PNG, PDF
- Falls back to manual entry if confidence is low — no silent errors
- Original documents stored in tenant-scoped cloud storage

### Supplier Registry
- Vendor CRUD: name, tax ID (RUT/RFC/CUIT), bank details
- Reusable across expense reports
- Useful for recurring vendors and supplier payments

### Dashboard & Reporting
- Expense totals by period, status, category, cost center, business unit, employee
- Export to XLSX (Excel) for accounting teams
- PDF report generation for accounting submission
- Optional: expense location tagging via Google Maps
- Optional: QR code per expense report for physical submission workflows

### Audit Log
- Every consequential action logged: submission, approval, rejection, payment, role change
- Each entry includes: timestamp, actor identity, action context
- Full traceability for audits, compliance, and dispute resolution

### Roles (per company)

| Role          | What they do                                                    |
|---------------|-----------------------------------------------------------------|
| Rendidor      | Submits expense reports, uploads receipts                       |
| Aprobador     | Reviews and approves or rejects submitted expenses              |
| Pagador       | Confirms disbursement, marks expenses as paid                   |
| Administrador | Full access: users, settings, reports, billing, role assignment |

### User Management
- Admin invites users by email
- Invited users complete registration before gaining access
- Pending queue for new users without tenant assignment
- Optional area-based permissions (restrict user to specific cost centers)

### Billing (self-serve)
- Administrators manage subscription, payment method, and invoice history from the app
- Automated account suspension on non-payment
- Upgrade/downgrade/cancel self-service
- Free trial for new accounts

---

## What Makes Us Different

| Differentiator | Detail |
|---|---|
| WhatsApp-native submission | Employees submit from the app they already use — no download, no new login |
| Direct Meta API | No BSP middleware (no Twilio, no 360dialog) — cheaper, faster, no relay dependency |
| OCR auto-fill | Google Document AI reads the receipt and fills the form — no manual transcription |
| Caja Chica & Fondos por Rendir | Native LATAM modules — not bolt-ons, not workarounds |
| Multi-company system | One login, multiple empresas, fast switch, full isolation |
| Workspaces | Unidades de Negocio + Centros de Costo + multi-currency per workspace |
| Advanced approval flow | Multi-step routing with amount thresholds and org structure |
| LATAM-native | Spanish-first, MercadoPago, CLP/MXN/ARS/COP, built for LATAM from day one |
| Audit trail | Every action logged — timestamp, actor, context |

---

## How We Compare

### vs. RindeGastos
Closest competitor — similar core product, both LATAM-focused.
We win on: WhatsApp submission, approval flow depth, multi-company system, workspaces with
business units and cost centers, multi-currency, OCR auto-fill.

### vs. Expensify
Strong US product, not built for LATAM.
They lack: WhatsApp channel, Caja Chica, Fondos por Rendir, MercadoPago, Spanish-first UX,
and native LATAM multi-company support. Pricing starts higher (~$5–20/user vs our $3).

### vs. Tickelia
Spanish/European tool — built for Spain, not LATAM.
No WhatsApp. No MercadoPago. Tax and role vocabulary designed for Spain.
Not a real competitor in Chile, México, or Argentina.

---

## Who It's For (ICP)

**Primary buyer:**
- CFO, Finance Manager, General Manager, Operations Manager
- Company size: 20–500 employees
- Location: Chile (primary), México, Argentina, Colombia, Perú
- Currently managing expenses via: WhatsApp groups, shared email, Excel

**Industries:** any company with field teams, sales reps, or distributed operations
(construction, logistics, retail chains, professional services, NGOs)

**Trigger to buy:** growing past 20 employees, recent audit, new finance hire, reimbursement dispute

**Secondary ICP:** accounting firms managing multiple client companies (multi-company use case)

---

## Common Questions

**Does the employee need to download an app?**
No. WhatsApp submission requires zero downloads. They use the WhatsApp they already have.

**How does OCR work?**
Employee sends a receipt photo via WhatsApp or uploads via web. Google Document AI reads it
and extracts amount, date, vendor, and tax fields. The form is pre-filled. Employee confirms.

**Is company data isolated?**
Yes. Each company's data is partitioned at the database level. Switching companies (in multi-company
mode) never exposes another company's data.

**What if OCR fails?**
The system falls back to a manual entry form. No expense is lost due to poor image quality.

**Can one user manage multiple companies?**
Yes. Native multi-company: one login, multiple empresas, fast switcher, full isolation, different
roles per company. Built for accounting firms and holding groups.

**What are Unidades de Negocio and Centros de Costo?**
Internal workspaces. Unidad de Negocio = business division. Centro de Costo = accounting cost center.
Each can run in its own currency. Reports filter by these dimensions.

**What currencies are supported?**
Each workspace can use its own currency (CLP, USD, MXN, ARS, COP, etc.). A company with Chile
and international operations tracks both in the same platform without mixing.

**What does it cost for a typical company?**
Average customer has 8 users. On Basic ($3/user/month) that's $24/month total.

**Is there a free trial?**
Yes. All new accounts get a free trial before requiring a paid plan.

**Can we export to our accounting system?**
Yes — XLSX and PDF export today. Direct ERP integrations are on the roadmap.
