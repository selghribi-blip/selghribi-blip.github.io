from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# Load .env before anything else so DATABASE_URL / ADMIN_API_KEY are available.
load_dotenv()

from .database import create_db_and_tables  # noqa: E402
from .routers import admin, news  # noqa: E402

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create DB tables on startup (idempotent — safe to run on every restart)."""
    create_db_and_tables()
    yield


app = FastAPI(
    title="Stock News & Sentiment API",
    description=(
        "A RESTful API that fetches financial news for stock tickers and "
        "performs sentiment analysis using NLP.\n\n"
        "## Authentication\n\n"
        "| Endpoint group | Header required |\n"
        "|---|---|\n"
        "| `/v1/*` (news, sentiment) | `X-API-Key: <your-api-key>` |\n"
        "| `/admin/*` | `X-Admin-Key: <ADMIN_API_KEY>` |\n\n"
        "Admin endpoints do **not** accept normal API keys.\n\n"
        "## Rate Limiting\n\n"
        "All endpoints are rate-limited at **60 requests / minute** per IP address."
    ),
    version="1.0.0",
    lifespan=lifespan,
    contact={"name": "Stock News API"},
    license_info={"name": "MIT"},
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(news.router)
app.include_router(admin.router)


@app.get("/health", tags=["Health"], summary="Health check")
@limiter.limit("60/minute")
async def health(request: Request) -> dict:
    """Returns `{"status": "ok"}` — useful for uptime monitors."""
    return {"status": "ok"}
