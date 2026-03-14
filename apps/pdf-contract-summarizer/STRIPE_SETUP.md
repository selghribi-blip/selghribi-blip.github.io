# Stripe Setup Guide — PDF & Contract Summarizer

Follow these steps to configure Stripe for the Pro plan billing.

---

## Step 1 — Create a Product

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products).
2. Click **+ Add product**.
3. Set **Name** to `Pro Plan` (or any descriptive name).
4. Save.

---

## Step 2 — Create the Pro Base Price ($19 / month)

Inside the product you just created, add a price:

| Field | Value |
|-------|-------|
| **Pricing model** | Standard pricing |
| **Price** | **$19.00** |
| **Billing period** | Monthly |
| **Usage type** | Licensed (default) |
| **Nickname** | `Pro Base` |

Click **Save price** and copy the **Price ID** (starts with `price_`).

Set in your environment:
```
STRIPE_PRICE_PRO_BASE=price_xxxxxxxxxxxxxxxxxxxx
```

---

## Step 3 — Create the Pro Overage Price ($0.05 / unit, metered)

Inside the same product, add a second price:

| Field | Value |
|-------|-------|
| **Pricing model** | Standard pricing |
| **Price** | **$0.05** per unit |
| **Billing period** | Monthly |
| **Usage type** | **Metered** |
| **Aggregation mode** | **Sum** |
| **Nickname** | `Pro Overage` |

> ⚠️ **The aggregation mode must be `Sum`.** This tells Stripe to add all
> usage records together for the billing period. Do **not** use `Max` or
> `Last ever`.

Click **Save price** and copy the **Price ID**.

Set in your environment:
```
STRIPE_PRICE_PRO_OVERAGE_METERED=price_yyyyyyyyyyyyyyyyyy
```

---

## Step 4 — Configure a Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks).
2. Click **+ Add endpoint**.
3. Set the endpoint URL to:
   ```
   https://app.artsmoroccan.me/api/stripe/webhook
   ```
4. Subscribe to the following events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
5. Save and copy the **Signing secret** (`whsec_...`).

Set in your environment:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
```

---

## Step 5 — Verify Checkout Session Configuration

The checkout session is created at `POST /api/stripe/checkout` and includes
**both** prices:

```typescript
line_items: [
  { price: process.env.STRIPE_PRICE_PRO_BASE,            quantity: 1 },
  { price: process.env.STRIPE_PRICE_PRO_OVERAGE_METERED  }, // metered — no quantity
]
```

This ensures:
- Stripe charges **$19** immediately for the base subscription.
- Stripe accumulates metered usage records and invoices
  **$0.05 × overage_summaries** at the end of each billing period.

---

## Summary of Required Environment Variables

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_BASE=price_...          # $19/month fixed
STRIPE_PRICE_PRO_OVERAGE_METERED=price_... # $0.05/unit metered (sum)
```

See `.env.example` for the full list of environment variables.
