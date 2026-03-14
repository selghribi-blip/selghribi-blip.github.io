# PDF & Contract Summarizer

An AI-powered micro-SaaS that summarizes PDFs and analyzes contracts. Upload any PDF and get an instant AI-generated summary. Pro users get contract mode with extracted clauses, obligations, dates, and risks.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM + SQLite (dev) / PostgreSQL (prod)
- **Auth**: NextAuth v5 (GitHub & Google OAuth)
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe (subscriptions + billing portal)

## Prerequisites

- Node.js 18+
- npm
- OpenAI API key ([platform.openai.com/api-keys](https://platform.openai.com/api-keys))
- Stripe account ([dashboard.stripe.com](https://dashboard.stripe.com))
- GitHub OAuth app (for GitHub login)
- Google OAuth app (for Google login)

## Setup

### 1. Install dependencies

```bash
cd apps/pdf-contract-summarizer
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all values (see [Environment Variables](#environment-variables) below).

### 3. Initialize the database

```bash
npm run db:push
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## GitHub OAuth Setup

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. Set:
   - **Application name**: PDF Summarizer (or any name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Copy the **Client ID** and generate a **Client Secret**
4. Add to `.env.local`:
   ```
   GITHUB_CLIENT_ID="your-client-id"
   GITHUB_CLIENT_SECRET="your-client-secret"
   ```

---

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret**
6. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

---

## Stripe Setup

### Create a product and price

1. Go to [dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. Click **Add product** → Name it "Pro Plan"
3. Add a **recurring price** (e.g., $9/month)
4. Copy the **Price ID** (starts with `price_`)
5. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PRO_PRICE_ID="price_..."
   ```

### Set up webhooks (local dev)

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Copy the **webhook signing secret** (starts with `whsec_`) and add it:
   ```
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite: `file:./dev.db` / PostgreSQL URL for prod |
| `AUTH_SECRET` | Random secret for NextAuth (run `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App base URL (e.g., `http://localhost:3000`) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `OPENAI_API_KEY` | OpenAI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro plan (`price_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |

---

## Features

| Feature | Free | Pro |
|---|---|---|
| PDF summaries per day | 3 | Unlimited |
| Max PDF size | 5 MB | 20 MB |
| PDF summary mode | ✅ | ✅ |
| Contract mode (clauses, risks, dates) | ❌ | ✅ |
| Summary history | ✅ | ✅ |
| Stripe billing portal | — | ✅ |

---

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the repo in [vercel.com](https://vercel.com), set **Root Directory** to `apps/pdf-contract-summarizer`
3. Add all environment variables in the Vercel dashboard
4. For production, switch `DATABASE_URL` to a PostgreSQL connection string (e.g., [Neon](https://neon.tech), [Supabase](https://supabase.com)) and update `prisma/schema.prisma` provider to `postgresql`
5. Update `NEXTAUTH_URL` to your production domain
6. Register production OAuth callback URLs with GitHub and Google
7. Add your production domain in Stripe webhook settings

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
