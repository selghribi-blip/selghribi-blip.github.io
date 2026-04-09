# PDF & Contract Summarizer

A Next.js 14 Micro-SaaS that summarizes PDFs and contracts using AI.
Free plan includes 3 summaries/day. Pro plan includes 200 summaries/month with overage billing at $0.05 per extra summary.

## Tech stack

- **Next.js 15** (App Router)
- **NextAuth v5** (GitHub + Google OAuth)
- **Prisma + SQLite** (swap to PostgreSQL for production)
- **Stripe** (subscriptions + metered overage billing)
- **OpenAI** (`gpt-4o-mini`)
- **Tailwind CSS**

## Plans

| Feature | Free | Pro |
|---|---|---|
| Summaries | 3 / day | 200 included / month |
| Overage | — | **$0.05 per extra summary** |
| Max PDF size | 5 MB | 35 MB |
| Contract mode | ✕ | ✓ |
| Price | $0 | $9 / month + overage |

## Local setup

```bash
cd apps/pdf-contract-summarizer

# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env.local

# 3. Apply DB migrations
npm run db:push

# 4. Start dev server
npm run dev
```

## Stripe setup

### 1. Create a Stripe product

Go to **Stripe Dashboard → Products → Add product**.

- Name: `PDF & Contract Summarizer Pro`

### 2. Add the base monthly price

Click **Add price** on the product:

- **Type**: Recurring
- **Billing period**: Monthly
- **Amount**: `$9.00`
- Copy the `price_xxx` ID → set as `STRIPE_PRICE_PRO_BASE` in `.env.local`

### 3. Add the metered overage price

Click **Add another price** on the same product:

- **Type**: Recurring (usage-based)
- **Billing period**: Monthly
- **Pricing model**: Per unit
- **Amount**: `$0.05`
- **Usage type**: Metered
- **Aggregate usage**: Sum
- Copy the `price_xxx` ID → set as `STRIPE_PRICE_PRO_OVERAGE_METERED` in `.env.local`

> ⚠️ Both prices must belong to the **same Stripe product**. The checkout session attaches both line items — the base price (quantity=1) and the metered price — to one subscription.

### 4. Configure the webhook

```bash
# Install Stripe CLI (https://stripe.com/docs/stripe-cli)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret → set as `STRIPE_WEBHOOK_SECRET`.

Events to forward in production (Stripe Dashboard → Webhooks):
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 5. How overage billing works

1. The webhook handler stores the **metered subscription item ID** (`stripeMeteredItemId`) in the `Subscription` table when a Pro checkout completes.
2. After each summary, the `/api/summarize` route increments a `UsageCounter` row.
3. Once the monthly counter exceeds **200**, `reportOverageUsage()` creates a **Stripe usage record** (quantity=1) on the metered subscription item.
4. Usage records are **idempotent**: an `OverageUsageEvent` row is inserted with a unique key (`userId:YYYY-MM:count`). If the same key already exists the Stripe call is skipped — no double-billing on retries.
5. Stripe aggregates the metered units at the end of the billing period and charges **$0.05 × overage count** on the next invoice.

## Project structure

```
src/
  app/
    (marketing)/page.tsx       Landing page
    (app)/
      dashboard/page.tsx       Usage dashboard with QuotaDisplay
      summarize/page.tsx       PDF upload + summary
    pricing/page.tsx           Pricing cards
    auth/sign-in/page.tsx      OAuth sign-in
    api/
      summarize/route.ts       Core summarize endpoint (plan gating + overage)
      quota/route.ts           Returns current quota for UI polling
      stripe/
        checkout/route.ts      Creates Stripe Checkout session (base + metered)
        portal/route.ts        Opens Stripe Billing Portal
        webhook/route.ts       Handles Stripe events, stores stripeMeteredItemId
  components/
    Navbar.tsx
    PricingCards.tsx           Shows $0.05/extra summary in Pro card
    UploadDropzone.tsx         PDF upload with mode selector
    PlanBadge.tsx              Shows plan + overage status
    QuotaDisplay.tsx           Progress bar + overage warning
  lib/
    auth.ts                    NextAuth config
    db.ts                      Prisma client singleton
    pdf.ts                     pdf-parse wrapper
    limits.ts                  checkQuota / incrementUsage (server-side enforcement)
    ai/
      provider.ts              AiProvider interface
      openai.ts                OpenAI implementation
    stripe/
      stripe.ts                Stripe SDK singleton
      plans.ts                 Plan config (limits, price IDs)
      billing.ts               reportOverageUsage() with idempotency
prisma/
  schema.prisma                User, Subscription (stripeMeteredItemId), UsageCounter, OverageUsageEvent
```
