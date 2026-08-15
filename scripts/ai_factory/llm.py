"""عميل الذكاء الاصطناعي | LLM client: Gemini first, OpenRouter as fallback."""

from __future__ import annotations

import json
import logging
import time
from typing import List, Optional

import requests

from .config import Settings

LOGGER = logging.getLogger(__name__)

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

TIMEOUT = 180
RETRIES = 2
BACKOFF = 8


class LLMError(RuntimeError):
    """فشل توليد النص | Raised when every configured provider fails."""


def _post_with_retries(url: str, *, headers: dict, payload: dict) -> dict:
    last_error: Optional[Exception] = None
    for attempt in range(1, RETRIES + 1):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=TIMEOUT)
            if response.status_code == 200:
                return response.json()
            retryable = response.status_code == 429 or response.status_code >= 500
            message = "HTTP {0}: {1}".format(response.status_code, response.text[:400])
            if not retryable:
                raise LLMError(message)
            last_error = LLMError(message)
        except requests.RequestException as exc:
            last_error = exc
        LOGGER.warning("attempt %s/%s failed: %s", attempt, RETRIES, last_error)
        if attempt < RETRIES:
            time.sleep(BACKOFF * attempt)
    raise LLMError(str(last_error))


def _gemini(settings: Settings, model: str, system: str, user: str, temperature: float) -> str:
    data = _post_with_retries(
        GEMINI_ENDPOINT.format(model=model),
        headers={
            "Content-Type": "application/json",
            "X-goog-api-key": settings.google_api_key,
        },
        payload={
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": 16384},
        },
    )
    candidates = data.get("candidates") or []
    if not candidates:
        raise LLMError("gemini returned no candidates: {0}".format(json.dumps(data)[:400]))
    parts = candidates[0].get("content", {}).get("parts") or []
    text = "".join(part.get("text", "") for part in parts).strip()
    if not text:
        raise LLMError("gemini returned empty text (finish reason: {0})".format(candidates[0].get("finishReason")))
    return text


def _openrouter(settings: Settings, system: str, user: str, temperature: float) -> str:
    data = _post_with_retries(
        OPENROUTER_ENDPOINT,
        headers={
            "Authorization": "Bearer {0}".format(settings.openrouter_api_key),
            "Content-Type": "application/json",
            "HTTP-Referer": settings.site_url,
            "X-Title": "artsmoroccan ai factory",
        },
        payload={
            "model": settings.openrouter_model,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
    )
    choices = data.get("choices") or []
    if not choices:
        raise LLMError("openrouter returned no choices: {0}".format(json.dumps(data)[:400]))
    text = (choices[0].get("message") or {}).get("content", "").strip()
    if not text:
        raise LLMError("openrouter returned empty text")
    return text


def complete(settings: Settings, system: str, user: str, temperature: float = 0.8) -> str:
    """توليد نص عبر أول مزوّد متاح | Generate text using the first provider that works."""
    errors: List[str] = []
    if settings.google_api_key:
        for model in settings.gemini_models:
            try:
                return _gemini(settings, model, system, user, temperature)
            except LLMError as exc:
                LOGGER.warning("gemini model %s failed: %s", model, exc)
                errors.append("gemini/{0}: {1}".format(model, exc))
    if settings.openrouter_api_key:
        try:
            return _openrouter(settings, system, user, temperature)
        except LLMError as exc:
            LOGGER.warning("openrouter failed: %s", exc)
            errors.append("openrouter: {0}".format(exc))
    if not errors:
        raise LLMError("no LLM provider configured: set GOOGLE_API_KEY or OPENROUTER_API_KEY")
    raise LLMError(" | ".join(errors))
