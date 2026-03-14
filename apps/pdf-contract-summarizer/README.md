# PDF & Contract Summarizer

AI-powered SaaS that summarizes PDFs and analyzes legal contracts. Built with Next.js 16, Prisma 7 (SQLite), NextAuth v5 (GitHub + Google OAuth), Stripe metered billing, and OpenAI.

---

## Plans & Quotas

| Feature               | Free                | Pro                                    |
|-----------------------|---------------------|----------------------------------------|
| Summaries             | 3 / day (UTC)       | 200 included / month (UTC)             |
| Max PDF size          | 5 MB                | 35 MB                                  |
| Contract analysis     | ✗                   | ✓                                      |
| Overage billing       | —                   | **$0.05 per extra summary** (metered)  |

- Pro users can continue summarizing after the 200/month quota.  
- Each additional summary beyond 200 is billed at **$0.05** via Stripe metered billing.
- Overage is idempotent — no duplicate charges on retries.

---

## Local Development

### 1. Clone and install

```bash
cd apps/pdf-contract-summarizer
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env` with your real keys (see the section below).

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Stripe Setup

### Step 1 – Create a Stripe Product for Pro

1. Go to **Stripe Dashboard → Products → Add product**
2. Name it **"PDF & Contract Summarizer Pro"**
3. Add **two prices**:

#### Price 1: Base subscription

| Field    | Value              |
|----------|--------------------|
| Type     | Recurring          |
| Amount   | e.g. $19.00 / month |
| Usage    | Licensed (not metered) |

Copy the `price_` ID → set as `STRIPE_PRICE_PRO_BASE` in `.env`.

#### Price 2: Overage (metered)

| Field              | Value                          |
|--------------------|--------------------------------|
| Type               | Recurring                      |
| Amount             | $0.05 per unit                 |
| Usage model        | Metered                        |
| Aggregate usage    | Sum                            |
| Meter event name   | `pdf_summary_overage` (or any) |

Copy the `price_` ID → set as `STRIPE_PRICE_PRO_OVERAGE_METERED` in `.env`.

Copy the **Billing Meter event name** → set as `STRIPE_BILLING_METER_EVENT_NAME` in `.env`.

### Step 2 – Configure Checkout (both prices)

The `/api/stripe/checkout` endpoint creates a session with both `STRIPE_PRICE_PRO_BASE` (quantity=1) and `STRIPE_PRICE_PRO_OVERAGE_METERED` (metered, no quantity). Stripe handles billing at end of period.

### Step 3 – Webhook

1. In Stripe Dashboard → **Webhooks → Add endpoint**:
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
2. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in `.env`

### Step 4 – OAuth (GitHub & Google)

**GitHub:**

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID + Secret → `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`

**Google:**

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Copy Client ID + Secret → `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

Generate auth secret: `openssl rand -base64 32` → `AUTH_SECRET`

---

## Environment Variables

See `.env.example` for the full list. Key variables:

```
STRIPE_PRICE_PRO_BASE            # Fixed monthly base price
STRIPE_PRICE_PRO_OVERAGE_METERED # Metered price for overage
STRIPE_BILLING_METER_EVENT_NAME  # Stripe Billing Meter event name (e.g. pdf_summary_overage)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

---

## Idempotency & Overage Billing

Each overage summary creates an `OverageUsageEvent` in the database with a deterministic `idempotencyKey` (userId + counter + 1-minute window). The same key is passed as the Stripe meter event `identifier`. If the event already exists in the DB, no new Stripe meter event is created — preventing double-billing on retries.

---

## Architecture

```
app/
  api/
    summarize/       — Server-side quota enforcement + PDF text extraction + AI summary
    stripe/
      checkout/      — Create Stripe Checkout session (base + metered prices)
      portal/        — Stripe Customer Portal
      webhook/       — Stripe webhook (update DB on subscription changes)
    quota/           — Return quota info for UI
  auth/sign-in/      — GitHub / Google sign-in page
  dashboard/         — Main app page
  pricing/           — Pricing page

lib/
  db.ts              — Prisma client (Prisma 7 + libsql adapter for SQLite)
  auth.ts            — NextAuth v5 (GitHub + Google + Prisma adapter)
  auth-edge.ts       — Lightweight JWT-only auth for middleware (no Prisma)
  pdf.ts             — PDF text extraction (pdf-parse v2)
  ai/                — OpenAI abstraction layer
  stripe/
    stripe.ts        — Lazy Stripe client initialization
    plans.ts         — Plan limits constants (FREE_DAILY_LIMIT=3, PRO_MONTHLY_LIMIT=200)
    billing.ts       — Quota check, usage recording, overage meter events

prisma/
  schema.prisma      — DB schema (User, Subscription, SummaryUsage, OverageUsageEvent)
```
