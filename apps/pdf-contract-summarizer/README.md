# PDF & Contract Summarizer — Stripe Pricing Setup

## Overview

This app uses **Stripe** to manage subscriptions with a **Free** and **Pro** plan.

| Plan | Price | Included Summaries | Overage |
|------|-------|--------------------|---------|
| Free | $0 | 3 / month | — |
| Pro  | **$19 / month** | **200 / month** | **$0.05** per extra summary |

---

## Stripe Product & Price Configuration

Create **one Product** in Stripe (e.g., "Pro Plan") and attach **two Prices** to it:

### 1. Pro Base Price (recurring fixed)

| Field | Value |
|-------|-------|
| Type | Recurring |
| Billing period | Monthly |
| Unit amount | **$19.00** (1900 cents) |
| Usage type | Licensed (standard) |
| Nickname | `Pro Base` |

### 2. Pro Overage Price (recurring metered)

| Field | Value |
|-------|-------|
| Type | Recurring |
| Billing period | Monthly |
| Unit amount | **$0.05** (5 cents) |
| Usage type | **Metered** |
| Billing scheme | Per unit |
| Aggregation mode | **Sum** |
| Nickname | `Pro Overage` |

> **Important:** The aggregation mode **must** be `Sum` so Stripe totals all usage
> records submitted during the billing period.

---

## Environment Variables

After creating the prices, copy their IDs into your `.env.local`:

```bash
# Stripe secret key (from Stripe Dashboard → Developers → API keys)
STRIPE_SECRET_KEY=sk_live_...

# Stripe webhook signing secret (from Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Pro Base: $19/month recurring fixed price ID
STRIPE_PRICE_PRO_BASE=price_...

# Pro Overage: $0.05/unit recurring metered price ID  (aggregation: sum)
STRIPE_PRICE_PRO_OVERAGE_METERED=price_...

# Your public domain (used for Stripe redirect URLs)
NEXT_PUBLIC_APP_URL=https://app.artsmoroccan.me
```

---

## Checkout Session Behaviour

When a user upgrades to Pro the app creates a Stripe Checkout Session with **both** prices:

```
line_items: [
  { price: STRIPE_PRICE_PRO_BASE,            quantity: 1 },
  { price: STRIPE_PRICE_PRO_OVERAGE_METERED  }   // no quantity — metered
]
```

Stripe will:
1. Charge **$19** immediately for the base seat.
2. Accumulate metered usage records throughout the month.
3. Invoice **$0.05 × extra_summaries** (beyond the 200 included) at period end.

---

## Billing Logic

| Condition | Action |
|-----------|--------|
| User is Free and has used 3 summaries | Block and prompt upgrade |
| User is Pro and has used ≤ 200 summaries | Allow, no extra charge |
| User is Pro and has used > 200 summaries | Allow + report 1 metered unit to Stripe per extra summary |

Usage is reported to Stripe via `POST /api/stripe/usage` after each summary is
generated, using `stripe.subscriptionItems.createUsageRecord(...)`.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env template and fill in your keys
cp .env.example .env.local

# Push Prisma schema to local SQLite DB
npm run db:push

# Run dev server
npm run dev
```

Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
