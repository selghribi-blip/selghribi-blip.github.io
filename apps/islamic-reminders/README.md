# ☪ Islamic Reminders — MVP Full-Stack App

> **Daily hadith reminders aligned with the Hijri calendar.**  
> Search Sunnah wisdom by problem category (anxiety, debt, patience, family…) and receive contextual reminders rooted in the Prophet's ﷺ guidance.

---

## Table of Contents

1. [Architecture](#architecture)  
2. [Tech Stack](#tech-stack)  
3. [Quick Start (Local)](#quick-start-local)  
4. [Environment Variables](#environment-variables)  
5. [Database & Seeding](#database--seeding)  
6. [API Documentation](#api-documentation)  
7. [Deploy to Heroku](#deploy-to-heroku)  
8. [Copyright & Hadith Data](#copyright--hadith-data)  
9. [Monetization Plan (30-Day MVP)](#monetization-plan-30-day-mvp)  

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                   │
│            React (Vite) SPA  ─  port 3000 (dev)         │
│   Login · Register · Dashboard · Search · Preferences   │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP / JSON  (proxied in dev)
                         ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND  (Node.js / Express)               │
│                       port 5000                          │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │  helmet  │  │   cors    │  │  express-rate-limit   │  │
│  └──────────┘  └───────────┘  └──────────────────────┘  │
│                                                          │
│  Routes:                                                 │
│    POST /api/auth/register   POST /api/auth/login        │
│    GET  /api/me                                          │
│    GET  /api/reminders/today                             │
│    GET  /api/hadith/search?q=&category=                  │
│    GET  /api/categories                                  │
│    POST /api/preferences                                 │
│                                                          │
│  In production: serves React /dist as static files       │
└────────────────────────┬────────────────────────────────┘
                         │  Mongoose ODM
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      MongoDB                             │
│   Collections: users · hadith · categories ·            │
│                reminderLogs                              │
│   Hosted: MongoDB Atlas (recommended) or local          │
└─────────────────────────────────────────────────────────┘
```

### Hosting

| Layer    | Service                              |
|----------|--------------------------------------|
| Backend  | Heroku (web dyno) — includes React build |
| Database | MongoDB Atlas (M0 free tier works)   |
| Frontend | Served from Express `/dist` static   |

---

## Tech Stack

| Layer     | Technology                               |
|-----------|------------------------------------------|
| Frontend  | React 18, Vite, React Router v6, Axios   |
| Backend   | Node.js ≥ 18, Express 4, Mongoose 8      |
| Database  | MongoDB (Atlas or local)                 |
| Auth      | JWT (jsonwebtoken) + bcryptjs            |
| Security  | helmet, cors, express-rate-limit         |
| Logging   | Winston, Morgan                          |
| Calendar  | Built-in `Intl` API (Islamic Umm al-Qura)|

---

## Quick Start (Local)

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB running locally **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1 — Clone and enter the app directory

```bash
git clone https://github.com/selghribi-blip/selghribi-blip.github.io.git
cd selghribi-blip.github.io/apps/islamic-reminders
```

### 2 — Install dependencies

```bash
# Install backend + frontend in one step
npm install          # installs concurrently
npm run install      # this runs: npm install --prefix backend && npm install --prefix frontend
```

Or install separately:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3 — Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values (see Environment Variables below)
```

### 4 — Seed the database

```bash
npm run seed
# or: cd backend && npm run seed
```

### 5 — Run in development mode

```bash
npm run dev
# Starts backend on :5000 and frontend on :3000 simultaneously
# Frontend proxies /api requests to the backend automatically
```

Open **http://localhost:3000** in your browser.

---

## Environment Variables

Set these in `backend/.env` for local development, or as Heroku Config Vars in production.

| Variable          | Required | Description                                               | Example                                      |
|-------------------|----------|-----------------------------------------------------------|----------------------------------------------|
| `MONGODB_URI`     | ✅        | MongoDB connection string                                 | `mongodb+srv://user:pass@cluster.mongodb.net/ir` |
| `JWT_SECRET`      | ✅        | Long random string for signing JWT tokens                 | (generate with `node -e "require('crypto').randomBytes(64).toString('hex')"`) |
| `JWT_EXPIRES_IN`  | ❌        | Token expiry (default: `7d`)                              | `30d`                                        |
| `NODE_ENV`        | ❌        | `development` or `production`                             | `production`                                 |
| `ALLOWED_ORIGINS` | ❌        | Comma-separated CORS origins                              | `https://yourapp.herokuapp.com`              |
| `PORT`            | ❌        | HTTP port (Heroku sets automatically)                     | `5000`                                       |
| `LOG_LEVEL`       | ❌        | Winston log level (default: `info`)                       | `debug`                                      |

---

## Database & Seeding

### Seed script (placeholder data)

```bash
cd backend
npm run seed
```

This inserts **8 categories** and **8 placeholder hadith** records (one per category, several with Hijri date context). See [`data/seed-data.js`](./backend/data/seed-data.js) for the full list.

### Import licensed hadith data

For production, replace placeholder texts with licensed content:

```bash
# Prepare a JSON file matching the expected format (see scripts/importHadith.js header)
cd backend
node scripts/importHadith.js --file=/path/to/licensed-dataset.json
```

See [Copyright & Hadith Data](#copyright--hadith-data) for licensing sources.

---

## API Documentation

All protected endpoints require the header:  
`Authorization: Bearer <token>`

### Auth

#### `POST /api/auth/register`

```json
// Request
{ "email": "user@example.com", "password": "securepass", "name": "Ahmad" }

// Response 201
{ "token": "...", "user": { "id": "...", "email": "...", "name": "Ahmad" } }
```

#### `POST /api/auth/login`

```json
// Request
{ "email": "user@example.com", "password": "securepass" }

// Response 200
{ "token": "...", "user": { "id": "...", "email": "...", "name": "Ahmad" } }
```

---

### User

#### `GET /api/me` 🔒

Returns the authenticated user's profile and preferences.

```json
{
  "id": "...",
  "email": "user@example.com",
  "name": "Ahmad",
  "preferences": {
    "categories": [{ "_id": "...", "slug": "patience", "name": "Patience (Sabr)" }],
    "notificationTime": "07:00",
    "locale": "en"
  }
}
```

---

### Reminders

#### `GET /api/reminders/today` 🔒

Returns up to 3 hadith for today's Hijri date, filtered by user's preferred categories.

```json
{
  "hijriDate": { "year": 1447, "month": 9, "day": 25, "monthName": "Ramadan" },
  "reminders": [
    {
      "_id": "...",
      "source": "Sahih al-Bukhari – Book of Fasting",
      "text": "...",
      "narrator": "Abu Hurairah (RA)",
      "grade": "Sahih",
      "categories": [{ "slug": "ramadan", "name": "Ramadan" }],
      "tags": ["ramadan", "fasting"]
    }
  ]
}
```

**Fallback logic:**  
1. Hadith matching exact Hijri month + day  
2. Hadith matching Hijri month only  
3. Any hadith from user's categories  

---

### Hadith Search

#### `GET /api/hadith/search?q=...&category=...&page=1&limit=10` 🔒

| Param      | Type   | Description                              |
|------------|--------|------------------------------------------|
| `q`        | string | Full-text keyword search                 |
| `category` | string | Category slug (e.g. `anxiety`, `debt`)   |
| `page`     | number | Pagination page (default: 1)             |
| `limit`    | number | Results per page (default: 10, max: 50)  |

```json
{
  "total": 3,
  "page": 1,
  "pages": 1,
  "results": [ /* hadith objects */ ]
}
```

---

### Categories

#### `GET /api/categories` 🔒

Returns all available categories.

```json
[
  { "_id": "...", "slug": "patience", "name": "Patience (Sabr)", "nameAr": "الصبر", "description": "...", "keywords": ["patience","hardship",...] },
  ...
]
```

---

### Preferences

#### `POST /api/preferences` 🔒

```json
// Request
{
  "categories": ["patience", "anxiety"],
  "notificationTime": "06:30",
  "locale": "en",
  "situation": "I'm struggling with debt and feeling overwhelmed"
}
```

The optional `situation` field is matched against category keywords using simple string matching — relevant categories are auto-added to the selection.

```json
// Response 200
{
  "preferences": {
    "categories": [{ "slug": "patience", "name": "Patience (Sabr)" }, ...],
    "notificationTime": "06:30",
    "locale": "en"
  }
}
```

---

## Deploy to Heroku

### Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) M0 cluster

### Steps

```bash
# 1. Create Heroku app
heroku create my-islamic-reminders

# 2. Set environment variables
heroku config:set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/ir"
heroku config:set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
heroku config:set NODE_ENV=production

# 3. Deploy from the apps/islamic-reminders subdirectory
#    (Heroku requires pushing the subtree as root)
git subtree push --prefix apps/islamic-reminders heroku main
# OR use the heroku-buildpack-subdir if needed:
# heroku buildpacks:set https://github.com/timanovsky/subdir-heroku-buildpack
# heroku config:set PROJECT_PATH=apps/islamic-reminders

# 4. Seed the database (run once after deploy)
heroku run "cd backend && npm run seed"

# 5. Open the app
heroku open
```

### How it works in production

1. Heroku runs `npm install` then `npm run build` (from root `package.json`).
2. `npm run build` builds the React app into `frontend/dist/`.
3. `npm start` starts the Express server.
4. Express serves the React build from `frontend/dist/` as static files.
5. All API routes (`/api/*`) are handled by Express; everything else returns `index.html`.

---

## Copyright & Hadith Data

> ⚠️ **This repository does NOT include copyrighted hadith translations.**

The seed data contains clearly marked `[PLACEHOLDER]` texts that serve as structural examples only. They are paraphrases / summaries, not verbatim translations.

**For production use, obtain licensed hadith text from:**

| Source              | URL                                    | Notes                                      |
|---------------------|----------------------------------------|--------------------------------------------|
| Sunnah.com API      | https://sunnah.com/developers          | Free for non-commercial; API key required  |
| HadithAPI.com       | https://hadithapi.com                  | REST API, requires registration            |
| Quran.com / Sunnah  | https://api.sunnah.com                 | Open-source JSON datasets available        |

After obtaining a dataset, run:

```bash
node backend/scripts/importHadith.js --file=/path/to/dataset.json
```

---

## Monetization Plan (30-Day MVP)

### Week 1 – Validate (Days 1–7)

- Launch to 10–20 beta users via Islamic forums / WhatsApp groups.
- Collect feedback: Which categories are most used? What's missing?
- **Free tier**: unlimited for first 30 days.

### Week 2 – Monetize Early (Days 8–14)

| Revenue Stream | How | Price |
|---|---|---|
| **Premium subscription** | Remove ads, unlock all categories, custom notification time | $2.99/mo or $19.99/yr |
| **WhatsApp / Telegram reminders** | Paid plan: daily hadith pushed to WhatsApp via Twilio API | $1.99/mo |
| **Arabic UI unlock** | One-time IAP for full Arabic interface | $0.99 |

### Week 3 – B2B & Affiliates (Days 15–21)

| Revenue Stream | How | Price |
|---|---|---|
| **Islamic schools / masjids** | White-label API access with institution branding | $49–99/mo |
| **Islamic app developers** | API key resale on [RapidAPI](https://rapidapi.com) | $9–29/mo tiers |
| **Sponsored reminders** | Halal businesses sponsor category-specific reminders | $100–300/mo |

### Week 4 – Scale (Days 22–30)

- Add **email digest** (SendGrid): daily Hijri reminder email → upsell premium.
- **Referral program**: share link → 1 month free for both.
- **Donation model**: Sadaqah / Zakat-style one-time contributions via Stripe.
- **Course upsell**: link to Islamic learning platforms (affiliate 15–30%).

### 30-Day Revenue Target

| Tier | Users | Revenue |
|---|---|---|
| 50 premium @ $2.99/mo | 50 | $150 |
| 5 B2B @ $49/mo | 5 | $245 |
| 2 sponsored slots @ $150 | 2 | $300 |
| **Total** | | **~$695 MRR** |

---

## Project Structure

```
apps/islamic-reminders/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express entry point
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Hadith.js
│   │   │   ├── Category.js
│   │   │   └── ReminderLog.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── me.js
│   │   │   ├── reminders.js
│   │   │   ├── hadith.js
│   │   │   ├── categories.js
│   │   │   └── preferences.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT protection
│   │   │   └── validate.js     # express-validator helper
│   │   └── utils/
│   │       ├── db.js           # MongoDB connection
│   │       ├── logger.js       # Winston logger
│   │       └── hijri.js        # Intl-based Hijri conversion
│   ├── scripts/
│   │   ├── seed.js             # Initial categories + placeholder hadith
│   │   └── importHadith.js     # Import from licensed JSON dataset
│   ├── data/
│   │   └── seed-data.js        # Seed data definitions
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js          # Axios instance + interceptors
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx   # Hijri date banner + reminders + search
│   │       └── Preferences.jsx # Category selection + situation matching
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json                # Root: orchestrates install + build + dev
├── Procfile                    # Heroku: web: node backend/src/app.js
├── app.json                    # Heroku: env vars declaration
└── README.md
```

---

*Built with ❤️ and tawakkul — may this tool bring benefit to the Ummah.*
