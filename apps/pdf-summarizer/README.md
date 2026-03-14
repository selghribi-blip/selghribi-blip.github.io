# PDF Summarizer — Micro-SaaS

A **Next.js 14 App Router** application that lets users upload PDF documents and receive AI-generated summaries. Built with Stripe subscriptions, NextAuth authentication, Prisma ORM, and your choice of OpenAI or Anthropic.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Auth | NextAuth 4 (GitHub OAuth + Email magic link) |
| Database ORM | Prisma 5 (SQLite local / PostgreSQL prod) |
| Payments | Stripe (subscription mode) |
| AI — OpenAI | GPT-4o-mini via `openai` SDK |
| AI — Anthropic | Claude 3 Haiku via `@anthropic-ai/sdk` |
| PDF parsing | `pdf-parse` |

---

## Folder Structure

```
apps/pdf-summarizer/
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── .env.example
├── .gitignore
├── prisma/
│   ├── schema.prisma         SQLite schema (User, Subscription, Summary + NextAuth models)
│   └── seed.ts               Creates a test user with INACTIVE subscription
└── src/
    ├── app/
    │   ├── layout.tsx         Root layout — SessionProvider + Navbar
    │   ├── page.tsx           Landing page
    │   ├── globals.css        Tailwind base styles
    │   ├── dashboard/         Subscription status + summary history
    │   ├── upload/            PDF upload UI (auth-guarded)
    │   ├── pricing/           Stripe checkout entry point
    │   └── api/
    │       ├── auth/[...nextauth]/   NextAuth handler
    │       ├── upload/              PDF extraction endpoint
    │       ├── summarize/           AI summarization endpoint (subscription-gated)
    │       └── stripe/
    │           ├── checkout/        Create Stripe Checkout session
    │           ├── portal/          Open Stripe Billing Portal
    │           └── webhook/         Handle Stripe webhook events
    ├── components/
    │   ├── Navbar.tsx
    │   ├── PdfUploader.tsx    Drag-and-drop uploader with step-by-step feedback
    │   └── SummaryDisplay.tsx Summary card with copy button
    ├── lib/
    │   ├── auth.ts            NextAuth config + getServerAuthSession helper
    │   ├── prisma.ts          Prisma singleton
    │   ├── stripe.ts          Stripe helpers (checkout, portal, customer)
    │   ├── pdf.ts             pdf-parse wrapper with 10 MB limit
    │   └── ai/
    │       ├── index.ts       Provider picker (reads AI_PROVIDER env var)
    │       ├── openai.ts      OpenAI implementation
    │       └── anthropic.ts   Anthropic implementation
    └── types/
        └── index.ts           Shared TypeScript interfaces
```

---

## Install & Run

### 1. Install dependencies

```bash
cd apps/pdf-summarizer
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in the required values — see "Environment Variables" section below
```

### 3. Generate Prisma client & run migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. (Optional) Seed the database

```bash
npx ts-node prisma/seed.ts
```

### 5. Start the development server

```bash
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite: `file:./dev.db` / PostgreSQL: `postgresql://...` |
| `NEXTAUTH_URL` | Full URL of your app, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID (optional) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret (optional) |
| `EMAIL_SERVER_HOST` | SMTP host for magic-link emails (optional) |
| `EMAIL_SERVER_PORT` | SMTP port, default `587` |
| `EMAIL_SERVER_USER` | SMTP username |
| `EMAIL_SERVER_PASSWORD` | SMTP password |
| `EMAIL_FROM` | Sender address, e.g. `noreply@example.com` |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_ID` | Price ID of your monthly plan (`price_...`) |
| `AI_PROVIDER` | `openai` or `anthropic` |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `NEXT_PUBLIC_APP_URL` | Public URL used in Stripe redirect URLs |

---

## Stripe Setup

1. Create a **Product** in the Stripe dashboard (e.g. "PDF Summarizer Pro").
2. Add a **recurring Price** at $9.99/month. Copy the `price_...` ID into `STRIPE_PRICE_ID`.
3. Copy your **Secret Key** (`sk_test_...`) and **Publishable Key** (`pk_test_...`).
4. Create a **Webhook endpoint** pointing to `https://yourdomain.com/api/stripe/webhook`.
   - Subscribe to: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`.
5. Copy the **Signing Secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

---

## Stripe Webhook — Local Testing

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will print a temporary `whsec_...` secret — paste it into `STRIPE_WEBHOOK_SECRET` in your `.env.local`.

---

## Database Seed

Creates a test user (`test@example.com`) with an `INACTIVE` subscription:

```bash
npx ts-node prisma/seed.ts
```

---

## Deployment Notes

### Vercel (recommended)

1. Push the repo; connect the project in Vercel, setting the **Root Directory** to `apps/pdf-summarizer`.
2. Add all env vars in Vercel's Environment Variables panel.
3. For production, swap `DATABASE_URL` to a PostgreSQL connection string (e.g. from [Neon](https://neon.tech)) and update `prisma/schema.prisma` provider to `postgresql`.
4. Run `npx prisma migrate deploy` as part of your build command or a one-time script.

### Jekyll coexistence

This Next.js app lives entirely inside `apps/pdf-summarizer/` and has its own `.gitignore`. It does **not** affect the Jekyll/GitHub Pages site at the repo root. Deploy them independently.
