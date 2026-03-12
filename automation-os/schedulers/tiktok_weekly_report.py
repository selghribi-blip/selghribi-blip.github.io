"""
TikTok Weekly Report Scheduler

Reads the most recent CSV from storage/tiktok_exports/, aggregates metrics,
appends a row to logs/weekly_report.csv, and sends a Telegram notification.
"""

import csv
import json
import os
import urllib.request
from datetime import date
from pathlib import Path
from typing import Optional

_BASE_DIR = Path(__file__).resolve().parent.parent
_EXPORTS_DIR = _BASE_DIR / "storage" / "tiktok_exports"
_REPORT_PATH = _BASE_DIR / "logs" / "weekly_report.csv"

# Common column-name aliases (lowercase, stripped)
_COL_ALIASES = {
    "posts": ["posts", "post_count", "video_count", "videos", "count"],
    "views": ["views", "video_views", "impressions", "plays", "view_count"],
    "likes": ["likes", "like_count", "hearts", "reactions"],
    "comments": ["comments", "comment_count", "replies"],
    "shares": ["shares", "share_count", "reposts"],
}

_REPORT_HEADERS = ["date", "posts", "views", "likes", "comments", "shares", "source_file"]

_TG_API = "https://api.telegram.org"
_REQUEST_TIMEOUT = 15


def _find_latest_csv(directory: Path) -> Optional[Path]:
    csvs = sorted(directory.glob("*.csv"), key=lambda p: p.stat().st_mtime, reverse=True)
    return csvs[0] if csvs else None


def _match_col(header: str, metric: str) -> bool:
    h = header.lower().strip().replace("-", "_").replace(" ", "_")
    return h in _COL_ALIASES.get(metric, [])


def _aggregate_csv(path: Path) -> dict:
    totals = {k: 0 for k in _COL_ALIASES}
    totals["posts"] = 0

    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames is None:
            return totals

        col_map = {}
        for field in reader.fieldnames:
            for metric in _COL_ALIASES:
                if _match_col(field, metric):
                    col_map.setdefault(metric, field)

        for row in reader:
            totals["posts"] += 1
            for metric, col in col_map.items():
                if metric == "posts":
                    continue
                try:
                    val = row.get(col, "0") or "0"
                    totals[metric] += int(float(val.replace(",", "")))
                except (ValueError, TypeError):
                    pass

    return totals


def _append_report(metrics: dict, source_file: str) -> None:
    _REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    write_header = not _REPORT_PATH.exists() or _REPORT_PATH.stat().st_size == 0
    with open(_REPORT_PATH, "a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=_REPORT_HEADERS)
        if write_header:
            writer.writeheader()
        writer.writerow(
            {
                "date": date.today().isoformat(),
                "posts": metrics.get("posts", 0),
                "views": metrics.get("views", 0),
                "likes": metrics.get("likes", 0),
                "comments": metrics.get("comments", 0),
                "shares": metrics.get("shares", 0),
                "source_file": source_file,
            }
        )


def _send_telegram(message: str) -> None:
    token = os.environ.get("TG_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TG_CHAT_ID", "").strip()
    if not token or not chat_id:
        return
    try:
        payload = {"chat_id": chat_id, "text": message, "parse_mode": "HTML"}
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{_TG_API}/bot{token}/sendMessage",
            data=data,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=_REQUEST_TIMEOUT) as resp:
            resp.read()
    except Exception as exc:
        print(f"[tiktok_report] Telegram notification failed: {type(exc).__name__}: {exc}", flush=True)


def main() -> None:
    """Entry point called by WorkerOS."""
    _EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

    latest = _find_latest_csv(_EXPORTS_DIR)
    if latest is None:
        msg = "⚠️ TikTok Weekly Report: لا يوجد ملف CSV في storage/tiktok_exports/"
        print(f"[tiktok_report] {msg}", flush=True)
        _send_telegram(msg)
        return

    try:
        metrics = _aggregate_csv(latest)
        _append_report(metrics, latest.name)
        msg = (
            f"✅ <b>TikTok Weekly Report</b> – {date.today()}\n"
            f"📄 Source: <code>{latest.name}</code>\n"
            f"🎬 Posts: {metrics['posts']}\n"
            f"👁 Views: {metrics['views']:,}\n"
            f"❤️ Likes: {metrics['likes']:,}\n"
            f"💬 Comments: {metrics['comments']:,}\n"
            f"🔁 Shares: {metrics['shares']:,}"
        )
        print(f"[tiktok_report] {msg}", flush=True)
        _send_telegram(msg)
    except Exception as exc:
        err_msg = f"❌ TikTok Weekly Report فشل: {type(exc).__name__}: {exc}"
        print(f"[tiktok_report] {err_msg}", flush=True)
        _send_telegram(err_msg)
        raise


if __name__ == "__main__":
    main()
