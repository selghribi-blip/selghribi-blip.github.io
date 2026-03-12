"""
master_run.py – Entry point for WorkerOS inside GitHub Codespaces.

Starts the Dashboard server in a background thread, creates WorkerOS,
registers scheduled workers, and calls run_forever().
"""

import sys
import threading
from pathlib import Path

# Add the automation-os directory to sys.path so sibling packages resolve
# (the directory name contains a hyphen and cannot be used as a Python import)
_AUTOMATION_OS_DIR = Path(__file__).resolve().parent.parent
if str(_AUTOMATION_OS_DIR) not in sys.path:
    sys.path.insert(0, str(_AUTOMATION_OS_DIR))

from workers.worker_manager import WorkerOS  # noqa: E402
from dashboard.app import run_server, set_worker_os  # noqa: E402
from schedulers.tiktok_weekly_report import main as tiktok_weekly  # noqa: E402


def _start_dashboard(worker_os: WorkerOS) -> None:
    set_worker_os(worker_os)
    run_server()


def main() -> None:
    osys = WorkerOS()

    # Launch dashboard in a daemon thread so it doesn't block the scheduler
    dash_thread = threading.Thread(target=_start_dashboard, args=(osys,), daemon=True)
    dash_thread.start()

    # Register workers
    osys.register_worker(
        name="tiktok_weekly_report",
        task_func=tiktok_weekly,
        schedule_time="23:50",  # runs daily at 23:50 for rolling weekly update
    )

    # Placeholder: add more workers here as needed, e.g.:
    # osys.register_worker("another_task", another_func, "08:00")

    osys.run_forever()


if __name__ == "__main__":
    main()
