"""
Automation OS Dashboard – lightweight HTTP server on 0.0.0.0:8080.

Endpoints
---------
GET /health  → 200 "OK"
GET /status  → 200 JSON with workers count, last 10 logs, uptime, snapshot
*            → 404 JSON
"""

import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

# Add the automation-os directory to sys.path for sibling-package imports
_AUTOMATION_OS_DIR = Path(__file__).resolve().parent.parent
if str(_AUTOMATION_OS_DIR) not in sys.path:
    sys.path.insert(0, str(_AUTOMATION_OS_DIR))

_START_TIME = time.time()
_worker_os_instance = None  # injected at runtime by master_run or kept None

HOST = "0.0.0.0"
PORT = int(os.environ.get("DASHBOARD_PORT", "8080"))


def set_worker_os(instance) -> None:
    """Inject a WorkerOS instance so /status can read live data."""
    global _worker_os_instance
    _worker_os_instance = instance


class _Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._respond(200, "text/plain", b"OK")
        elif self.path == "/status":
            self._respond(200, "application/json", self._build_status())
        else:
            body = json.dumps(
                {"error": "not found", "path": self.path}, ensure_ascii=False
            ).encode()
            self._respond(404, "application/json", body)

    # ------------------------------------------------------------------

    def _build_status(self) -> bytes:
        uptime = round(time.time() - _START_TIME, 1)
        payload: dict = {
            "uptime_seconds": uptime,
            "workers_count": 0,
            "last_10_logs": [],
            "workers_snapshot": {},
        }
        if _worker_os_instance is not None:
            try:
                snapshot = _worker_os_instance.get_status_snapshot()
                payload["workers_count"] = len(snapshot)
                payload["last_10_logs"] = _worker_os_instance.get_mem_logs(10)
                payload["workers_snapshot"] = snapshot
            except Exception:
                pass
        return json.dumps(payload, ensure_ascii=False, default=str).encode()

    def _respond(self, code: int, content_type: str, body: bytes) -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args) -> None:  # suppress default stderr noise
        pass


def run_server(host: str = HOST, port: int = PORT) -> None:
    server = HTTPServer((host, port), _Handler)
    print(f"[dashboard] listening on {host}:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()
