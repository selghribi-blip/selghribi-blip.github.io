from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from database import engine
from models import ApiKey, UsageLog

REQUEST_ID_HEADER = "X-Request-ID"


class UsageLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Assign a request ID early so it is available in responses too
        request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())

        response: Response = await call_next(request)
        response.headers[REQUEST_ID_HEADER] = request_id

        # Resolve api_key_id from request state (set by auth dependency if present)
        api_key: Optional[ApiKey] = getattr(request.state, "_resolved_api_key", None)
        api_key_id: Optional[int] = api_key.id if api_key else None

        self._log(
            api_key_id=api_key_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            request_id=request_id,
        )

        return response

    @staticmethod
    def _log(
        api_key_id: Optional[int],
        method: str,
        path: str,
        status_code: int,
        request_id: str,
    ) -> None:
        from sqlmodel import Session

        log = UsageLog(
            api_key_id=api_key_id,
            method=method,
            path=path,
            status_code=status_code,
            request_id=request_id,
            created_at=datetime.now(timezone.utc),
        )
        with Session(engine) as session:
            session.add(log)
            session.commit()
