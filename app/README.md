# PDF & Contract Summarizer — Next.js App

AI-powered PDF summarisation with OAuth login and Stripe subscriptions.

## Plans

| Feature | Free | Pro ($9/mo) |
|---------|------|-------------|
| Standard PDF summary | ✓ (5/day) | ✓ Unlimited |
| Contract Mode | ✗ | ✓ |
| OAuth login | ✓ | ✓ |

## Domain & Deployment

**Recommended subdomain:** `app.artsmoroccan.me`

Deploy this Next.js app to [Vercel](https://vercel.com) (or any Node.js host) and point the
`app.artsmoroccan.me` subdomain to it.

### DNS Setup (artsmoroccan.me)

Add a CNAME record in your DNS provider:

```
Type : CNAME
Name : app
Value: cname.vercel-dns.com   (or your host's CNAME target)
TTL  : Auto / 3600
```

The Jekyll static site stays on the apex domain `artsmoroccan.me` (served by GitHub Pages via the `CNAME` file). The Next.js app lives entirely at `app.artsmoroccan.me` — they are independent deployments.

## Local Development

### Prerequisites
- Node.js 20+
- npm 10+

### Setup

```bash
cd app
cp .env.example .env.local
# Edit .env.local with your credentials
npm install
npm run dev
# App running at http://localhost:3000
```

### Required environment variables

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | Deployment URL (`https://app.artsmoroccan.me` in production) |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth App credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_…` or `sk_test_…`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_…` or `pk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_…`) |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Price ID for the Pro monthly plan in Stripe |
| `OPENAI_API_KEY` | OpenAI API key for summarisation |
| `FREE_PLAN_DAILY_LIMIT` | Daily summary limit for Free users (default: `5`) |

## OAuth Provider Setup

### GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Set **Homepage URL** → `https://app.artsmoroccan.me`
3. Set **Callback URL** → `https://app.artsmoroccan.me/api/auth/callback/github`

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Set **Authorised redirect URI** → `https://app.artsmoroccan.me/api/auth/callback/google`

## Stripe Setup

### Create the Pro Plan
1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create a product: **PDF Summarizer Pro**
3. Add a recurring price: **$9 / month**
4. Copy the **Price ID** (`price_…`) into `STRIPE_PRO_MONTHLY_PRICE_ID`

### Register Webhook
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://app.artsmoroccan.me/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing Secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`

## Architecture

```
app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # NextAuth.js OAuth handler
│   │   │   ├── summarize/           # PDF upload + AI summary endpoint
│   │   │   ├── billing/             # Stripe Checkout + cancel subscription
│   │   │   └── webhooks/stripe/     # Stripe webhook handler
│   │   ├── dashboard/               # Main app UI (server + client components)
│   │   ├── login/                   # OAuth sign-in page
│   │   ├── pricing/                 # Plan comparison page
│   │   ├── layout.tsx               # Root layout with SessionProvider
│   │   └── page.tsx                 # Landing page
│   └── lib/
│       ├── auth.ts                  # NextAuth options
│       ├── stripe.ts                # Stripe client + plan definitions
│       ├── subscription.ts          # getUserPlan() helper
│       └── rateLimit.ts             # In-memory rate limiter (Free plan)
├── .env.example                     # Environment variable template
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Upgrading the Rate Limiter

The default `src/lib/rateLimit.ts` uses an **in-memory Map**. This resets when the
server restarts and does not scale across multiple instances.

For production, replace it with a Redis-backed store (e.g. [Upstash](https://upstash.com/)):

```ts
// Example with @upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 d'),
});
```
