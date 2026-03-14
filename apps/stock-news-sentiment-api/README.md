# Stock News & Sentiment API

A production-ready **FastAPI** service that fetches stock news from multiple RSS sources (Google News, Yahoo Finance, Bing News) and returns per-article **VADER** sentiment scores.

## Features

| Feature | Details |
|---------|---------|
| Multi-source RSS | Google News, Yahoo Finance, Bing News; configurable extras |
| De-duplication | Articles de-duplicated by URL across sources |
| VADER Sentiment | Compound, positive, negative, neutral scores per article |
| API Key Auth | SHA-256+salt hashed keys stored in SQLite |
| Admin Endpoints | Create / list / revoke keys; view usage logs |
| Rate Limiting | In-memory fixed-window per key with per-key overrides |
| Usage Logging | Every request logged (key id, path, method, status, request id) |
| Swagger UI | `/docs` — all endpoints with auth headers pre-configured |

---

## Requirements

- **Python 3.9+** (Python 3.12 recommended; matches the Dockerfile)

## Quick Start (local)

```bash
# 1. Install dependencies
cd apps/stock-news-sentiment-api
pip install -r requirements.txt

# 2. Copy env file and configure
cp .env.example .env
# Set ADMIN_API_KEY in .env

# 3. Start the server (DB is created automatically on first run)
uvicorn app.main:app --reload

# 4. Open Swagger UI
open http://localhost:8000/docs
```

---

## Docker

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env — at minimum set ADMIN_API_KEY

# 2. Build and start
docker compose up --build -d

# 3. Check health
curl http://localhost:8000/health

# 4. Stop
docker compose down
```

> **Data persistence** — The SQLite database is stored in the `./data/` directory, which is mounted as a volume in the Docker Compose setup.

---

## Database Initialization

The app creates all tables automatically on startup via SQLAlchemy's `Base.metadata.create_all()`. No manual migration steps are required for a fresh install.

To use a non-SQLite database, set the `DATABASE_URL` environment variable to any SQLAlchemy-compatible URL (e.g. `postgresql+psycopg2://user:pass@host/db`).

---

## Authentication

All `/v1/*` endpoints (except admin routes) require an **X-API-Key** header.

**Admin endpoints** require an **X-Admin-API-Key** header matching the `ADMIN_API_KEY` environment variable.

### Create your first API key

```bash
curl -X POST http://localhost:8000/v1/admin/keys \
  -H "X-Admin-API-Key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-key"}'
```

The response contains `plaintext_key` — **store it now**, it is shown only once.

---

## API Reference

### Public Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| GET | `/v1/news` | X-API-Key | Fetch news + sentiment |
| GET | `/v1/sources` | X-API-Key | List available RSS sources |

### `/v1/news` Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | **required** | Ticker or search query |
| `source` | string | `all` | `google` \| `yahoo` \| `bing` \| `all` |
| `max_results` | int | `20` | Max articles (1–100) |

**Example:**

```bash
curl "http://localhost:8000/v1/news?q=AAPL&source=all&max_results=10" \
  -H "X-API-Key: <your-key>"
```

### Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/admin/keys` | Create a new API key |
| GET | `/v1/admin/keys` | List all API keys |
| POST | `/v1/admin/keys/{id}/revoke` | Revoke an API key |
| GET | `/v1/admin/usage` | View usage logs |

#### Create Key Request Body

```json
{
  "name": "client-name",
  "rate_limit_requests": 100,
  "rate_limit_window": 60
}
```

Set `rate_limit_requests` and `rate_limit_window` to `0` to use the global defaults from `RATE_LIMIT_REQUESTS` / `RATE_LIMIT_WINDOW_SECONDS`.

#### Usage Query Parameters

| Param | Description |
|-------|-------------|
| `from` | Start datetime (ISO 8601) |
| `to` | End datetime (ISO 8601) |
| `limit` | Max rows (default 100, max 1000) |

---

## Rate Limiting

| Setting | Default | Env Var |
|---------|---------|---------|
| Max requests | 60 | `RATE_LIMIT_REQUESTS` |
| Window | 60 s | `RATE_LIMIT_WINDOW_SECONDS` |

Per-key overrides are set at key creation time (`rate_limit_requests`, `rate_limit_window`).

---

## RSS Sources

| Source key | Feed |
|------------|------|
| `google` | Google News RSS search |
| `yahoo` | Yahoo Finance RSS headlines |
| `bing` | Bing News RSS |

Add custom sources via `RSS_EXTRA_TEMPLATES` env var (comma-separated URL templates with `{query}` placeholder):

```
RSS_EXTRA_TEMPLATES=https://feeds.finance.yahoo.com/rss/2.0/headline?s={query}&region=US&lang=en-US
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_API_KEY` | **Yes** | — | Secret key for admin endpoints |
| `DATABASE_URL` | No | `sqlite:///data/app.db` | SQLAlchemy DB URL |
| `RATE_LIMIT_REQUESTS` | No | `60` | Default max requests per window |
| `RATE_LIMIT_WINDOW_SECONDS` | No | `60` | Default window size in seconds |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated CORS origins |
| `RSS_EXTRA_TEMPLATES` | No | — | Extra RSS templates |
