# Stock News Sentiment API

> A production-ready RESTful API built with **Python FastAPI** that fetches
> financial news for any stock ticker via RSS and performs **VADER sentiment analysis**.
> Designed for easy deployment and monetisation on **RapidAPI**.

---

## Features

| Feature | Details |
|---|---|
| News source | Google News RSS (no API key required) |
| Sentiment | VADER (fast, no key, pluggable) |
| Auth | `X-RapidAPI-Key` / `X-API-Key` headers |
| Rate limiting | In-memory fixed-window per API key |
| Caching | In-memory TTL cache per ticker+limit |
| Observability | Structured logs, request-ID middleware |
| Docs | Swagger UI at `/docs`, ReDoc at `/redoc` |

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check (no auth) |
| `GET` | `/v1/news?ticker=TSLA&limit=20` | Latest news items |
| `GET` | `/v1/news/{news_id}?ticker=TSLA` | Single news item by ID |
| `GET` | `/v1/sentiment?ticker=TSLA&limit=20` | Aggregate + per-article sentiment |

---

## Local Setup

### Prerequisites

- Python 3.11+

### Steps

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and edit env vars
cp .env.example .env
# Edit .env – set API_KEYS at minimum

# 4. Start the server
uvicorn app.main:app --reload
```

The API is now available at `http://localhost:8000`.
Swagger UI: `http://localhost:8000/docs`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `API_KEYS` | _(empty)_ | Comma-separated valid API keys. Empty = unauthenticated (dev only). |
| `API_KEY` | _(empty)_ | Single-key fallback (used when `API_KEYS` is not set). |
| `RATE_LIMIT_REQUESTS` | `60` | Max requests per window per key. |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Window size in seconds. |
| `NEWS_CACHE_TTL_SECONDS` | `120` | Cache TTL for news/sentiment results. |
| `HTTP_TIMEOUT_SECONDS` | `10.0` | Upstream fetch timeout. |
| `HTTP_MAX_RETRIES` | `3` | Upstream fetch retry attempts. |
| `USER_AGENT` | `StockNewsSentimentAPI/1.0` | User-Agent for upstream requests. |
| `SENTIMENT_ENGINE` | `vader` | Sentiment engine (`vader` is the only built-in). |
| `APP_ENV` | `production` | `development` disables some production restrictions. |

---

## Example `curl` Requests

```bash
export API_KEY="your_api_key_here"
export BASE="http://localhost:8000"

# Health (no auth required)
curl "$BASE/health"

# Latest news for TSLA
curl -H "X-API-Key: $API_KEY" "$BASE/v1/news?ticker=TSLA&limit=10"

# Sentiment analysis
curl -H "X-API-Key: $API_KEY" "$BASE/v1/sentiment?ticker=AAPL&limit=20"

# Single news item (use an ID from the news response)
curl -H "X-API-Key: $API_KEY" "$BASE/v1/news/a1b2c3d4e5f6a7b8?ticker=TSLA"

# RapidAPI-style headers
curl \
  -H "X-RapidAPI-Key: $API_KEY" \
  -H "X-RapidAPI-Host: stock-news-sentiment-api.p.rapidapi.com" \
  "$BASE/v1/sentiment?ticker=NVDA&limit=5"
```

---

## Docker

### Build & run

```bash
docker build -t stock-news-sentiment-api .
docker run -p 8000:8000 \
  -e API_KEYS="your_key_here" \
  -e RATE_LIMIT_REQUESTS=100 \
  stock-news-sentiment-api
```

### docker-compose (optional)

```yaml
version: "3.9"
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - API_KEYS=your_key_here
      - RATE_LIMIT_REQUESTS=100
      - NEWS_CACHE_TTL_SECONDS=120
```

---

## RapidAPI Deployment Notes

1. **Deploy** the container to any cloud (Railway, Render, Fly.io, AWS ECS, GCP
   Cloud Run, …) and note the public HTTPS URL.
2. **Create a new API** on [RapidAPI Hub](https://rapidapi.com/provider).
3. Set the **Base URL** to your deployment URL.
4. Under *Transformations → Request Headers*, add `X-RapidAPI-Key` as a
   passthrough header – RapidAPI forwards it automatically to your backend.
5. Set the env var `API_KEYS` on your deployment to the same set of keys you
   configure in the RapidAPI dashboard.
6. Configure plans and pricing in the RapidAPI dashboard.
   - The `/health` endpoint can be whitelisted as a free probe.

---

## Rate Limiting – Redis Alternative

The default limiter is in-memory (suitable for single-instance deployments).
For multi-instance / horizontal-scaling, implement a Redis-backed variant:

1. In `app/rate_limiter.py`, add a `RedisRateLimiter` class that uses
   `redis.asyncio` with `INCR` + `EXPIRE`.
2. Replace the `check_rate_limit` dependency with the Redis version when
   `RATE_LIMITER=redis` env var is set.
3. Set `REDIS_URL=redis://your-redis-host:6379/0`.

---

## Project Structure

```
apps/stock-news-sentiment-api/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app, middleware, exception handlers
│   ├── config.py        # Settings from env vars
│   ├── auth.py          # API key dependency
│   ├── rate_limiter.py  # Fixed-window in-memory rate limiter
│   ├── cache.py         # In-memory TTL cache
│   ├── fetcher.py       # httpx + feedparser RSS news fetcher
│   ├── sentiment.py     # VADER sentiment engine (pluggable)
│   └── routers/
│       ├── __init__.py
│       ├── health.py    # GET /health
│       ├── news.py      # GET /v1/news, GET /v1/news/{id}
│       └── sentiment.py # GET /v1/sentiment
├── tests/
│   └── test_api.py
├── .env.example
├── Dockerfile
├── requirements.txt
└── README.md
```

---

## License

MIT
