"""GET /health"""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Health check",
    response_description="Service is up and healthy",
)
async def health() -> dict:
    """
    Returns a simple JSON payload indicating the service is running.
    No authentication required.
    """
    return {"status": "ok", "service": "stock-news-sentiment-api"}
