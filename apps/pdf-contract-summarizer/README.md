# 📄 PDF & Contract Summarizer — Micro-SaaS

A Next.js application that lets users upload PDF files and receive AI-powered summaries.
Features a **Free tier** and a **Pro tier** with Stripe subscription billing and metered
overage charges.

---

## Table of Contents

- [Features](#features)
- [Plan Limits](#plan-limits)
- [Overage Billing](#overage-billing)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Stripe Setup](#stripe-setup)
- [Stripe CLI Webhook Testing](#stripe-cli-webhook-testing)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Deployment](#deployment)

---

## Features

| Feature | Free | Pro |
|---------|------|-----|
| General PDF summary | ✅ 3/day | ✅ 200 included/month |
| Contract analysis mode | ❌ Pro only | ✅ |
| Max PDF upload size | 5 MB | 35 MB |
| Overage after included quota | ❌ blocked | ✅ pay-as-you-go |
| Google / GitHub OAuth | ✅ | ✅ |

---

## Plan Limits

### Free
- **3 summaries per day** (UTC calendar day).
- **5 MB** maximum PDF size.
- Only **General** summary mode available.
- After 3 summaries the API returns HTTP 429 with a clear upgrade prompt.

### Pro ($19/month base + overage)
- **200 included summaries per month** (UTC calendar month).
- **35 MB** maximum PDF size.
- Both **General** and **Contract** summary modes available.
- After 200 included summaries, usage continues with overage billing (see below).

---

## Overage Billing

When a Pro user exceeds 200 summaries in a billing month:

1. The summary **still proceeds** — the user is never blocked.
2. Each extra summary creates a **metered usage record** in Stripe via the
   [Usage Records API](https://docs.stripe.com/api/usage_records).
3. Overage is reported to the `stripeMeteredItemId` (the subscription item for
   `STRIPE_PRICE_PRO_OVERAGE_METERED`).
4. **Idempotency** is enforced via a deterministic key
   (`overage-{userId}-{monthKey}-{count}`) stored in `OverageUsageEvent`. Retries
   never double-report.
5. At the end of the billing period Stripe automatically invoices the overage.

### API Response fields for Pro

```json
{
  "summary": "...",
  "remaining_month_included": 0,
  "overage_count_this_month": 5
}
```

The UI displays a badge indicating overage billing is active.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Prisma |
| Auth | NextAuth.js (Google + GitHub OAuth) |
| AI | OpenAI gpt-4o-mini |
| PDF parsing | pdf-parse |
| Payments | Stripe (subscriptions + metered billing) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (local or cloud e.g. Supabase, Neon)
- Stripe account
- OpenAI API key
- GitHub OAuth App and/or Google OAuth App

### Installation

```bash
cd apps/pdf-contract-summarizer

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env.local

# Push Prisma schema to the database
npx prisma db push

# Start the development server
npm run dev
```

The app is available at `http://localhost:3000`.

---

## Environment Variables

See [`.env.example`](.env.example) for the full list.  
Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for NextAuth (run `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public URL of the app |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth App credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth App credentials |
| `OPENAI_API_KEY` | OpenAI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_PRO_BASE` | Price ID of the fixed monthly Pro fee |
| `STRIPE_PRICE_PRO_OVERAGE_METERED` | Price ID of the metered overage price |

---

## Stripe Setup

### 1. Create the Pro Base Price

In the Stripe Dashboard → **Products** → **+ Add product**:

- **Name**: PDF & Contract Summarizer Pro
- **Pricing model**: Standard
- **Price**: $19.00 USD
- **Billing period**: Monthly
- **Usage type**: Licensed

Copy the `price_…` ID to `STRIPE_PRICE_PRO_BASE`.

### 2. Create the Overage Metered Price

In the same product (or a new one) → **+ Add another price**:

- **Pricing model**: Standard
- **Price**: (e.g.) $0.10 USD per unit
- **Billing period**: Monthly
- **Usage type**: **Metered**
- **Aggregation mode**: Sum

Copy the `price_…` ID to `STRIPE_PRICE_PRO_OVERAGE_METERED`.

### 3. Configure Webhook

In Stripe Dashboard → **Developers** → **Webhooks** → **+ Add endpoint**:

- **Endpoint URL**: `https://your-app.vercel.app/api/stripe/webhook`
- **Events to listen**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

---

## Stripe CLI Webhook Testing

Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) then run:

```bash
# Forward Stripe events to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger a test checkout
stripe trigger checkout.session.completed

# Or trigger a subscription event
stripe trigger customer.subscription.created
```

The CLI will print a `whsec_…` signing secret — use it as `STRIPE_WEBHOOK_SECRET`
during local development.

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `User` | Extended NextAuth user with plan, Stripe IDs, and `stripeMeteredItemId` |
| `Account` | NextAuth OAuth accounts |
| `Session` | NextAuth sessions |
| `UsageCounterDaily` | Free plan: daily summary count keyed by `YYYY-MM-DD` |
| `UsageCounterMonthly` | Pro plan: monthly summary count keyed by `YYYY-MM` |
| `OverageUsageEvent` | One row per overage Stripe usage record (idempotency key stored) |

---

## Project Structure

```
apps/pdf-contract-summarizer/
├── prisma/
│   └── schema.prisma            # Prisma schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │   │   ├── summarize/route.ts            # PDF summarise endpoint
│   │   │   └── stripe/
│   │   │       ├── checkout/route.ts         # Create checkout session
│   │   │       ├── portal/route.ts           # Customer portal redirect
│   │   │       └── webhook/route.ts          # Stripe webhook handler
│   │   ├── auth/sign-in/page.tsx             # Sign-in page
│   │   ├── dashboard/page.tsx                # Main app page
│   │   ├── pricing/page.tsx                  # Pricing page
│   │   ├── layout.tsx
│   │   └── page.tsx                          # Landing page
│   ├── components/
│   │   └── QuotaBadge.tsx                    # Quota indicator badge
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── openai.ts                     # OpenAI provider
│   │   │   └── provider.ts                   # AI provider interface
│   │   ├── stripe/
│   │   │   ├── plans.ts                      # Stripe price IDs
│   │   │   └── stripe.ts                     # Stripe SDK singleton
│   │   ├── auth.ts                           # NextAuth options
│   │   ├── db.ts                             # Prisma singleton
│   │   ├── keys.ts                           # UTC day/month key helpers
│   │   ├── plans.ts                          # Plan limits
│   │   └── usage.ts                          # Quota check + overage reporting
│   └── middleware.ts                         # Route protection
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Deployment

Deploy to [Vercel](https://vercel.com):

```bash
cd apps/pdf-contract-summarizer
vercel
```

Set all environment variables from `.env.example` in the Vercel project settings.

> **Note:** GitHub Pages only hosts static files. This Next.js app requires a Node.js
> server and must be deployed to Vercel, Render, Fly.io, or similar.
