# Stock News & Sentiment API

A RESTful API built with **FastAPI** that fetches financial news for stock tickers and performs sentiment analysis. Designed for deployment on platforms like **RapidAPI**.

---

## Features

- 📰 **Real-time news** — scrapes Yahoo Finance / Google News RSS feeds per ticker
- 🧠 **Sentiment analysis** — NLP-powered scoring (positive / negative / neutral) via TextBlob
- 🔑 **API-key auth** — issue keys to customers; admin uses a separate `X-Admin-Key`
- 🛡️ **Rate limiting** — 60 requests/minute per IP
- 📊 **Usage tracking** — every request logged to SQLite
- 📖 **Swagger UI** — auto-generated at `/docs`

---

## Quick Start

```bash
# 1. Go to the project directory
cd apps/stock-news-sentiment-api

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Download TextBlob corpora (one-time)
python -m textblob.download_corpora

# 5. Set environment variables
cp .env.example .env
#  → Edit .env and set ADMIN_API_KEY to a strong secret.

# 6. Start the server (creates ./app.db automatically if it doesn't exist)
uvicorn app.main:app --reload
```

The API is now running at <http://localhost:8000>.  
Interactive docs: <http://localhost:8000/docs>

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ADMIN_API_KEY` | **Yes** | — | Secret used to authenticate admin endpoints via `X-Admin-Key` header |
| `DATABASE_URL` | No | `sqlite:///./app.db` | SQLAlchemy database URL. SQLite file is created in the project directory by default. |

Copy `.env.example` → `.env` and fill in your values:

```dotenv
ADMIN_API_KEY=change-me-to-a-strong-secret
DATABASE_URL=sqlite:///./app.db
```

---

## Authentication

### Regular endpoints (`/v1/*`)

Pass your API key in the request header:

```
X-API-Key: <your-api-key>
```

### Admin endpoints (`/admin/*`)

Pass the admin secret in the request header:

```
X-Admin-Key: <ADMIN_API_KEY>
```

> ⚠️ Admin endpoints **do not** accept normal API keys. Only `X-Admin-Key` grants admin access.

---

## API Endpoints

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Liveness check |

### Stock News & Sentiment

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/news/{ticker}` | X-API-Key | Latest news articles for a ticker |
| GET | `/v1/sentiment/{ticker}` | X-API-Key | Sentiment analysis for a ticker |

**Query parameters:**

| Parameter | Default | Description |
|---|---|---|
| `limit` | `10` | Number of articles to return (1–50) |

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/api-keys` | X-Admin-Key | Create a new API key |
| GET | `/admin/api-keys` | X-Admin-Key | List all API keys |
| PATCH | `/admin/api-keys/{id}/revoke` | X-Admin-Key | Deactivate an API key |
| DELETE | `/admin/api-keys/{id}` | X-Admin-Key | Permanently delete an API key |
| GET | `/admin/usage` | X-Admin-Key | Aggregated usage statistics |

---

## Example Requests

### Create an API key (admin)

```bash
curl -X POST http://localhost:8000/admin/api-keys \
  -H "X-Admin-Key: your-admin-secret" \
  -H "Content-Type: application/json" \
  -d '{"name": "customer-1"}'
```

### Get news for AAPL

```bash
curl http://localhost:8000/v1/news/AAPL \
  -H "X-API-Key: <api-key-from-above>"
```

### Get sentiment for TSLA

```bash
curl "http://localhost:8000/v1/sentiment/TSLA?limit=5" \
  -H "X-API-Key: <api-key-from-above>"
```

---

## Docker

```bash
# Build
docker build -t stock-sentiment-api .

# Run (set ADMIN_API_KEY at runtime)
docker run -p 8000:8000 \
  -e ADMIN_API_KEY=your-admin-secret \
  stock-sentiment-api
```

The SQLite database file is stored at `/app/app.db` inside the container. Mount a volume to persist it:

```bash
docker run -p 8000:8000 \
  -e ADMIN_API_KEY=your-admin-secret \
  -v $(pwd)/data:/app \
  stock-sentiment-api
```

---

## Project Structure

```
apps/stock-news-sentiment-api/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app, lifespan, rate limiting
│   ├── database.py      # SQLModel engine + session dependency
│   ├── models.py        # APIKey, UsageLog tables
│   ├── auth.py          # require_api_key / require_admin_key dependencies
│   ├── scraper.py       # Async RSS news fetcher
│   ├── sentiment.py     # TextBlob sentiment analysis
│   └── routers/
│       ├── __init__.py
│       ├── news.py      # /v1/news and /v1/sentiment endpoints
│       └── admin.py     # /admin/* endpoints
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
└── requirements.txt
```

---

## License

MIT
