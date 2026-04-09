# Stock News & Sentiment API

A **FastAPI**-based REST API that fetches real-time stock news from multiple RSS feeds and runs sentiment analysis on headlines. Designed for hosting on **RapidAPI** (or any cloud provider).

---

## Features

| Feature | Details |
|---|---|
| 📰 Multi-source RSS | Google News + configurable RSS templates via env var |
| 😊 Sentiment Analysis | TextBlob polarity / subjectivity per article + aggregate |
| 🔑 DB-backed API key auth | SHA-256+salt hashed keys stored in SQLite (or Postgres) |
| 🛑 Per-key rate limiting | Fixed-window with per-key overrides; returns `429 + Retry-After` |
| 📝 Usage logging | Every request logged to `UsageLog` table |
| 🔧 Admin endpoints | Create / list / revoke keys; usage summary with date filters |
| 📄 Swagger / ReDoc | Auto-generated docs at `/docs` and `/redoc` |

---

## Quick Start

```bash
cd apps/stock-news-sentiment-api

# 1. Copy and edit env
cp .env.example .env
# Edit .env: set API_KEY_SALT and ADMIN_API_KEY

# 2. Install dependencies
pip install -r requirements.txt
python -m textblob.download_corpora   # download NLP corpora once

# 3. Start the server (tables are created automatically on startup)
uvicorn main:app --reload
```

Swagger UI: <http://localhost:8000/docs>

---

## Docker

```bash
docker build -t stock-news-api .
docker run -p 8000:8000 \
  -e API_KEY_SALT=my-salt \
  -e ADMIN_API_KEY=my-admin-key \
  stock-news-api
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./stock_api.db` | SQLAlchemy connection string |
| `API_KEY_SALT` | `changeme-salt-replace-me` | Salt for SHA-256 key hashing — **change before use** |
| `ADMIN_API_KEY` | — | Secret for admin endpoints (`X-Admin-Key` header) |
| `RATE_LIMIT_REQUESTS` | `30` | Max requests per window (default for all keys) |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Window size in seconds |
| `RSS_TEMPLATES` | — | Comma-separated URL templates with `{ticker}` placeholder |

---

## API Reference

### Authentication

Include one of these headers with every request to `/v1/*`:

```
X-RapidAPI-Key: <your-key>
```
or
```
X-API-Key: <your-key>
```

### Endpoints

#### `GET /v1/news`

Fetch recent news for a ticker.

| Param | Type | Default | Description |
|---|---|---|---|
| `ticker` | string | **required** | Stock symbol, e.g. `AAPL` |
| `source` | string | `all` | `google` or `all` |
| `limit` | int | `20` | 1–100 |

#### `GET /v1/sentiment`

Fetch news + sentiment analysis.

Same parameters as `/v1/news`. Returns per-article sentiment plus aggregate polarity.

#### Admin Endpoints (require `X-Admin-Key`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/admin/keys` | Create a new API key |
| `GET` | `/v1/admin/keys` | List all keys |
| `POST` | `/v1/admin/keys/{id}/revoke` | Revoke a key |
| `GET` | `/v1/admin/usage` | Usage summary (optional `from` / `to` ISO datetime query params) |

**Create key example:**

```bash
curl -X POST http://localhost:8000/v1/admin/keys \
  -H "X-Admin-Key: my-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-client", "rate_limit_requests_override": 60}'
```

Response includes the plaintext key **only once** — store it safely.

---

## Database Schema

```
ApiKey
  id, name, key_prefix, key_hash, status (active|revoked)
  rate_limit_requests_override, rate_limit_window_seconds_override
  created_at, last_used_at

UsageLog
  id, api_key_id (FK), method, path, status_code, request_id, created_at
```

Tables are created automatically on startup (`create_db_and_tables()`).

---

## RapidAPI Setup

1. Deploy this API (e.g., Railway, Render, Fly.io, AWS).
2. Point RapidAPI to your base URL.
3. RapidAPI forwards `X-RapidAPI-Key` — no code changes needed.
4. Create API keys via the admin endpoint for direct (non-RapidAPI) access.

---

## License

MIT
