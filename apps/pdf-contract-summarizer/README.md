# 📄 PDF & Contract Summarizer

A Micro-SaaS built with **Next.js 15**, **Tailwind CSS**, **Prisma**, and **Stripe**.

Upload any PDF — research papers, reports, or legal contracts — and get a structured AI summary in seconds.

---

## 🚀 Features

| Feature | Free | Pro |
|---|---|---|
| General PDF Summary | ✓ | ✓ |
| **Contract Summary mode** | ✗ | ✓ |
| Summaries per day | **3** | — |
| Summaries per month | — | **200** |
| Max PDF size | 5 MB | 25 MB |
| Google & GitHub sign-in | ✓ | ✓ |
| English & Arabic output | ✓ | ✓ |
| Priority support | ✗ | ✓ |

---

## 📊 Usage Limits

### Free Plan
- **3 summaries per day** (resets at UTC midnight)
- Counter tracked by UTC date (`YYYY-MM-DD`)
- General PDF summary only
- Max PDF size: 5 MB

### Pro Plan ($9/month)
- **200 summaries per month** (resets on the 1st of each UTC month)
- Counter tracked by UTC month (`YYYY-MM`)
- General + **Contract Summary** mode
- Max PDF size: 25 MB

Usage is enforced **server-side** in the `/api/summarize` route. Every API response includes a `quota` field:

```json
{
  "quota": {
    "plan": "pro",
    "period": "2026-03",
    "used": 12,
    "limit": 200,
    "remaining": 188
  }
}
```

When the limit is exceeded, the API returns **HTTP 402** with a descriptive error:

```json
{
  "error": "Pro plan limit reached: you have used all 200 summaries for this month (2026-03). Please wait until next month.",
  "quota": { "plan": "pro", "period": "2026-03", "used": 200, "limit": 200, "remaining": 0 }
}
```

Contract mode attempted on Free plan returns **HTTP 403**:

```json
{
  "error": "Contract Summary mode is a Pro feature. Upgrade to Pro to unlock it.",
  "upgradeUrl": "/pricing"
}
```

---

## 🗂 Folder Structure

```
apps/pdf-contract-summarizer/
├── prisma/
│   └── schema.prisma          # User + UsageRecord models
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Landing page
│   │   ├── auth/sign-in/       # OAuth sign-in page
│   │   ├── dashboard/          # Usage stats + billing
│   │   ├── summarize/          # Upload & summarize
│   │   ├── pricing/            # Plan comparison
│   │   └── api/
│   │       ├── summarize/      # POST – enforce quota, run AI
│   │       ├── quota/          # GET  – current quota status
│   │       └── stripe/         # Checkout, portal, webhook
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── QuotaBadge.tsx      # Remaining summaries badge
│   │   ├── UploadDropzone.tsx  # PDF upload + mode selector
│   │   ├── PricingCards.tsx
│   │   └── ManageBillingButton.tsx
│   └── lib/
│       ├── auth.ts             # NextAuth (Google + GitHub)
│       ├── db.ts               # Prisma client singleton
│       ├── quota.ts            # FREE_DAILY_LIMIT=3, PRO_MONTHLY_LIMIT=200
│       ├── pdf.ts              # PDF text extraction
│       ├── ai/
│       │   ├── provider.ts
│       │   └── openai.ts
│       └── stripe/
│           ├── stripe.ts
│           └── plans.ts
├── .env.example
├── middleware.ts
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔧 Local Setup

### Prerequisites
- Node.js 20+
- npm / pnpm / yarn

### Install

```bash
cd apps/pdf-contract-summarizer
npm install
```

### Environment variables

```bash
cp .env.example .env.local
# Fill in your keys (see .env.example for all required values)
```

### Database

```bash
npm run db:push      # creates the SQLite DB and tables
npm run db:studio    # (optional) open Prisma Studio
```

### Run

```bash
npm run dev          # http://localhost:3000
```

---

## 🏗 Deployment

The app requires a **Node.js server** (not static hosting).

**Recommended: [Vercel](https://vercel.com)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all env variables from `.env.example` in your Vercel project settings.

For the **Stripe webhook**:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 🧪 Testing Quota Logic

The core quota logic lives in `src/lib/quota.ts` and can be tested independently:

```ts
import { checkAndIncrementQuota, getQuotaStatus, QuotaExceededError } from "@/lib/quota";

// Get current status (read-only)
const status = await getQuotaStatus(userId, "pro");
// { plan: "pro", period: "2026-03", used: 12, limit: 200, remaining: 188, exceeded: false }

// Increment and check (throws QuotaExceededError when limit reached)
try {
  const status = await checkAndIncrementQuota(userId, "free");
} catch (err) {
  if (err instanceof QuotaExceededError) {
    console.log(err.message); // human-readable error
  }
}
```

---

## 📄 License

MIT
