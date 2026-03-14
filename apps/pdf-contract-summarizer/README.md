# 📄 PDF & Contract Summarizer — Micro-SaaS

A Next.js 14 application that summarizes PDF documents and contracts using AI.
Built with **NextAuth v5**, **Prisma + SQLite**, **Stripe** billing, and **OpenAI**.

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your values
cp .env.example .env.local

# 3. Set up the database
npx prisma migrate dev

# 4. Start the development server
npm run dev
```

App runs at **http://localhost:3000**.

---

## 💳 Stripe Setup

### 1 — Create a Product

In the [Stripe Dashboard](https://dashboard.stripe.com/products) click **+ Add product**.

- **Name:** `Pro Plan`
- **Description:** `PDF & Contract Summarizer — Pro subscription`

### 2 — Create the Pro Base Price (recurring fixed)

Inside the Pro Plan product, click **+ Add price**:

| Field | Value |
|-------|-------|
| Type | **Recurring** |
| Billing interval | **Monthly** |
| Amount | **$19.00** |
| Currency | USD |

Copy the resulting price ID (e.g. `price_1Abc...`) and set:

```
STRIPE_PRICE_PRO_BASE=price_1Abc...
```

### 3 — Create the Pro Overage Price (recurring, metered)

Inside the **same** Pro Plan product, click **+ Add price** again:

| Field | Value |
|-------|-------|
| Type | **Recurring** |
| Usage type | **Metered** |
| Billing scheme | **Per unit** |
| Unit amount | **$0.05** (5 cents) |
| Aggregation mode | **Sum** |
| Billing interval | **Monthly** |

Copy the resulting price ID and set:

```
STRIPE_PRICE_PRO_OVERAGE_METERED=price_1Def...
```

> **Why Sum aggregation?**  
> Each extra summary beyond the 200 included/month records 1 usage unit.
> Stripe sums all units at invoice time and charges `$0.05 × units`.

### 4 — Configure Checkout

The checkout session automatically attaches **both prices**:

1. `STRIPE_PRICE_PRO_BASE` — flat $19/month recurring charge
2. `STRIPE_PRICE_PRO_OVERAGE_METERED` — metered $0.05/unit charge (billed in arrears)

See [`src/app/api/stripe/checkout/route.ts`](src/app/api/stripe/checkout/route.ts).

### 5 — Set Up Webhooks

In Stripe Dashboard → Developers → Webhooks → **Add endpoint**:

- **URL:** `https://your-domain.com/api/stripe/webhook`
- **Events:**
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

Copy the signing secret and set:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📦 Pricing Model

| Plan | Price | Summaries included | Overage |
|------|-------|--------------------|---------|
| **Free** | $0/month | 5 per month | — |
| **Pro** | **$19/month** | **200 per month** | **$0.05 per extra summary** |

Overage is billed via Stripe's metered billing at the end of each billing period.

---

## 🏗️ Architecture

```
apps/pdf-contract-summarizer/
├── .env.example               ← env var reference
├── package.json
├── next.config.ts
├── prisma/
│   └── schema.prisma
└── src/
    ├── app/
    │   ├── api/
    │   │   └── stripe/
    │   │       ├── checkout/
    │   │       │   └── route.ts   ← creates checkout with base + metered prices
    │   │       └── webhook/
    │   │           └── route.ts   ← handles subscription lifecycle
    │   └── pricing/
    │       └── page.tsx           ← pricing UI ($19/mo + overage info)
    └── lib/
        ├── stripe.ts              ← Stripe client
        └── billing.ts             ← records metered usage to Stripe
```

---

## 🔑 Required Environment Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_PRO_BASE` | Pro Base price ID — **$19/month recurring fixed** |
| `STRIPE_PRICE_PRO_OVERAGE_METERED` | Pro Overage price ID — **$0.05/unit metered (sum)** |
| `DATABASE_URL` | Prisma database URL |
| `NEXTAUTH_SECRET` | NextAuth secret |
| `NEXTAUTH_URL` | NextAuth URL |
| `OPENAI_API_KEY` | OpenAI API key |

---

## 📄 License

MIT
