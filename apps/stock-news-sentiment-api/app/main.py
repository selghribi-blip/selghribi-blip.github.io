"""
FastAPI application entry-point.

Run with:
    uvicorn app.main:app --reload
"""
from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import health, news, sentiment

# ── Logging ───────────────────────────────────────────────────────────────────

class _RequestIdFormatter(logging.Formatter):
    """Formatter that injects a default ``request_id`` when missing."""

    def format(self, record: logging.LogRecord) -> str:
        if not hasattr(record, "request_id"):
            record.request_id = "-"  # type: ignore[attr-defined]
        return super().format(record)


_handler = logging.StreamHandler()
_handler.setFormatter(
    _RequestIdFormatter(
        "%(asctime)s %(levelname)s %(name)s [%(request_id)s] %(message)s"
    )
)
logging.basicConfig(level=logging.INFO, handlers=[_handler])

logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    logger.info(
        "Starting stock-news-sentiment-api (env=%s, rate_limit=%d/%ds)",
        settings.APP_ENV,
        settings.RATE_LIMIT_REQUESTS,
        settings.RATE_LIMIT_WINDOW_SECONDS,
    )
    yield
    logger.info("Shutting down stock-news-sentiment-api")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Stock News Sentiment API",
    description=(
        "Fetches the latest financial news for a given stock ticker "
        "and performs VADER sentiment analysis. "
        "Suitable for integration via RapidAPI.\n\n"
        "**Auth**: pass your API key in the `X-RapidAPI-Key` or `X-API-Key` header."
    ),
    version="1.0.0",
    contact={"name": "RapidAPI Marketplace"},
    license_info={"name": "MIT"},
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ── Request-ID + timing middleware ────────────────────────────────────────────
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    start = time.monotonic()

    # Make request_id available in log records for this coroutine
    old_factory = logging.getLogRecordFactory()

    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.request_id = request_id  # type: ignore[attr-defined]
        return record

    logging.setLogRecordFactory(record_factory)

    try:
        response = await call_next(request)
    except Exception:
        raise
    finally:
        logging.setLogRecordFactory(old_factory)

    duration_ms = (time.monotonic() - start) * 1000
    logger.info(
        "%s %s → %d (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.1f}"
    return response


# ── Exception handlers ────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception for %s %s", request.method, request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(news.router)
app.include_router(sentiment.router)
