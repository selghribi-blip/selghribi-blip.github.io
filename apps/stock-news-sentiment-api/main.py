from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables
from middleware import UsageLoggingMiddleware
from routers import admin, news, sentiment


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Stock News & Sentiment API",
    description=(
        "Fetch real-time stock news from multiple RSS sources and run "
        "sentiment analysis on headlines. "
        "Authenticate with `X-RapidAPI-Key` or `X-API-Key`."
    ),
    version="1.0.0",
    contact={"name": "selghribi-blip"},
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(UsageLoggingMiddleware)

app.include_router(news.router)
app.include_router(sentiment.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Stock News & Sentiment API is running."}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
