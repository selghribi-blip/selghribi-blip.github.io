"""FastAPI Stock News & Sentiment API — main application entry point."""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import Depends, FastAPI, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .admin import router as admin_router
from .auth import get_current_key
from .database import Base, engine, get_db
from .models import APIKey, UsageLog
from .news import SourceParam, available_sources, fetch_news
from .rate_limit import check_rate_limit

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# DB bootstrap: create tables on startup if they don't exist.
# ---------------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Stock News & Sentiment API",
    description=(
        "Fetch real-time stock news from multiple RSS sources and get VADER sentiment scores. "
        "Authenticate via **X-API-Key** header. "
        "Admin operations require **X-Admin-API-Key** header."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — restrict in production via ALLOWED_ORIGINS env.
_origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
_origins = [o.strip() for o in _origins_raw.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Usage-logging middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def usage_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response: Response = await call_next(request)

    # Log asynchronously (best-effort) using a fresh session.
    api_key_id: Optional[int] = getattr(request.state, "api_key_id", None)
    from .database import SessionLocal  # local import to avoid circular

    db = SessionLocal()
    try:
        log = UsageLog(
            api_key_id=api_key_id,
            path=str(request.url.path),
            method=request.method,
            status_code=response.status_code,
            request_id=request_id,
            created_at=datetime.now(timezone.utc),
        )
        db.add(log)
        db.commit()
    except Exception:  # noqa: BLE001
        logger.exception("Failed to write usage log for request_id=%s", request_id)
        db.rollback()
    finally:
        db.close()

    response.headers["X-Request-Id"] = request_id
    return response


# ---------------------------------------------------------------------------
# Include routers
# ---------------------------------------------------------------------------
app.include_router(admin_router)


# ---------------------------------------------------------------------------
# Pydantic response schemas
# ---------------------------------------------------------------------------

class SentimentScore(BaseModel):
    label: str
    compound: float
    positive: float
    negative: float
    neutral: float


class NewsArticle(BaseModel):
    title: str
    link: str
    published: str
    summary: str
    source: str
    sentiment: SentimentScore


class NewsResponse(BaseModel):
    query: str
    source: str
    count: int
    articles: List[NewsArticle]


class HealthResponse(BaseModel):
    status: str
    version: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["meta"])
def health() -> HealthResponse:
    """Public health-check endpoint."""
    return HealthResponse(status="ok", version=app.version)


@app.get(
    "/v1/news",
    response_model=NewsResponse,
    tags=["news"],
    summary="Fetch stock news with sentiment analysis",
)
def get_news(
    request: Request,
    q: str = Query(..., description="Ticker or search query, e.g. AAPL"),
    source: SourceParam = Query(
        default="all",
        description="RSS source: google | yahoo | bing | all",
    ),
    max_results: int = Query(default=20, ge=1, le=100, description="Max articles to return"),
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_key),
) -> NewsResponse:
    """
    Fetch news articles for a ticker / query and return VADER sentiment scores.

    Requires a valid API key in the **X-API-Key** header.
    """
    # Attach key id to request state for usage logging.
    request.state.api_key_id = api_key.id

    # Per-key rate limiting.
    check_rate_limit(
        key_id=api_key.id,
        rate_limit_requests=api_key.rate_limit_requests,
        rate_limit_window=api_key.rate_limit_window,
    )

    articles = fetch_news(query=q, source=source, max_results=max_results)

    return NewsResponse(
        query=q,
        source=source,
        count=len(articles),
        articles=articles,
    )


@app.get(
    "/v1/sources",
    tags=["news"],
    summary="List available RSS source names",
)
def list_sources(
    api_key: APIKey = Depends(get_current_key),
) -> dict:
    """Return the list of RSS source keys supported by this deployment."""
    return {"sources": available_sources()}


# ---------------------------------------------------------------------------
# Custom OpenAPI — inject securitySchemes so Swagger UI shows the auth inputs.
# ---------------------------------------------------------------------------

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema.setdefault("components", {}).setdefault("securitySchemes", {})
    schema["components"]["securitySchemes"]["ApiKeyAuth"] = {
        "type": "apiKey",
        "in": "header",
        "name": "X-API-Key",
    }
    schema["components"]["securitySchemes"]["AdminKeyAuth"] = {
        "type": "apiKey",
        "in": "header",
        "name": "X-Admin-API-Key",
    }
    # Apply ApiKeyAuth globally; admin routes also advertise AdminKeyAuth.
    for path, path_item in schema.get("paths", {}).items():
        for method, operation in path_item.items():
            if path.startswith("/v1/admin"):
                operation["security"] = [{"AdminKeyAuth": []}]
            else:
                operation.setdefault("security", [{"ApiKeyAuth": []}])
    schema["security"] = [{"ApiKeyAuth": []}]
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi  # type: ignore[method-assign]
