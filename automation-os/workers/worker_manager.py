"""
WorkerOS – multi-worker manager with scheduling, thread isolation,
JSONL logging, and graceful shutdown.
"""

import json
import logging
import os
import signal
import threading
import time
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import Callable, Dict, List, Optional

logger = logging.getLogger(__name__)

_BASE_DIR = Path(__file__).resolve().parent.parent
_LOG_DIR = _BASE_DIR / "logs"
_JSONL_LOG = _LOG_DIR / "worker_manager.jsonl"

_MAX_MEM_LOGS = 200  # keep last N log entries in memory


class WorkerOS:
    """Manages multiple scheduled workers running in isolated threads."""

    def __init__(self, base_dir: Optional[Path] = None) -> None:
        self._base_dir = Path(base_dir) if base_dir else _BASE_DIR
        self._log_dir = self._base_dir / "logs"
        self._log_dir.mkdir(parents=True, exist_ok=True)
        (self._base_dir / "storage" / "tiktok_exports").mkdir(
            parents=True, exist_ok=True
        )

        self._jsonl_path = self._log_dir / "worker_manager.jsonl"
        self._mem_logs: deque = deque(maxlen=_MAX_MEM_LOGS)
        self._workers: Dict[str, dict] = {}
        self._locks: Dict[str, threading.Lock] = {}
        self._stop_event = threading.Event()
        self._start_time = time.time()

        self._setup_logging()
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def register_worker(
        self, name: str, task_func: Callable, schedule_time: str
    ) -> None:
        """Register a worker with a daily schedule (HH:MM)."""
        if name in self._workers:
            raise ValueError(f"Worker '{name}' already registered")
        self._workers[name] = {
            "name": name,
            "task_func": task_func,
            "schedule_time": schedule_time,
            "last_run": None,
            "last_status": "idle",
            "run_count": 0,
        }
        self._locks[name] = threading.Lock()
        self._log(name, "registered", f"scheduled at {schedule_time}")

    def run_forever(self) -> None:
        """Block and dispatch workers according to their schedule until stopped."""
        self._log("system", "started", "WorkerOS run_forever loop active")
        try:
            while not self._stop_event.is_set():
                now = datetime.now().strftime("%H:%M")
                for name, worker in list(self._workers.items()):
                    if worker["schedule_time"] == now:
                        self._maybe_run(name)
                time.sleep(15)
        finally:
            self._log("system", "stopped", "WorkerOS shutting down")

    def get_status_snapshot(self) -> dict:
        """Return a snapshot of all workers' current status."""
        return {
            name: {
                "schedule_time": w["schedule_time"],
                "last_run": w["last_run"],
                "last_status": w["last_status"],
                "run_count": w["run_count"],
            }
            for name, w in self._workers.items()
        }

    def get_mem_logs(self, n: int = 10) -> List[dict]:
        """Return last n log entries from memory."""
        logs = list(self._mem_logs)
        return logs[-n:]

    def stop(self) -> None:
        """Signal the run_forever loop to exit."""
        self._stop_event.set()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _maybe_run(self, name: str) -> None:
        lock = self._locks[name]
        if not lock.acquire(blocking=False):
            self._log(name, "skipped", "already running – parallel run prevented")
            return
        thread = threading.Thread(
            target=self._run_worker, args=(name, lock), daemon=True
        )
        thread.start()

    def _run_worker(self, name: str, lock: threading.Lock) -> None:
        worker = self._workers[name]
        worker["last_status"] = "running"
        worker["last_run"] = datetime.utcnow().isoformat()
        self._log(name, "started", "worker execution started")
        try:
            worker["task_func"]()
            worker["last_status"] = "success"
            worker["run_count"] += 1
            self._log(name, "success", "worker finished successfully")
        except Exception as exc:
            worker["last_status"] = "error"
            self._log(name, "error", f"worker raised exception: {type(exc).__name__}: {exc}")
        finally:
            lock.release()

    def _log(self, worker: str, event: str, message: str) -> None:
        entry = {
            "ts": datetime.utcnow().isoformat(),
            "worker": worker,
            "event": event,
            "message": message,
        }
        self._mem_logs.append(entry)
        try:
            with open(self._jsonl_path, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except OSError as exc:
            logger.warning("Could not write JSONL log: %s", exc)

    def _handle_signal(self, signum: int, frame) -> None:  # noqa: ARG002
        self._log("system", "signal", f"received signal {signum}, stopping")
        self.stop()

    def _setup_logging(self) -> None:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        )
