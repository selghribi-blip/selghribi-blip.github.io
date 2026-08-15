"""تتبّع ما نُشر | Persistent record of published topics (avoids duplicates)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List


class State:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.entries: List[Dict[str, str]] = []
        if path.exists():
            raw = json.loads(path.read_text(encoding="utf-8") or "{}")
            self.entries = raw.get("published", [])

    @property
    def published_keys(self) -> set:
        return {entry["key"] for entry in self.entries if "key" in entry}

    def record(self, key: str, title: str, targets: Dict[str, str]) -> None:
        self.entries.append(
            {
                "key": key,
                "title": title,
                "published_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                **{"target_{0}".format(name): value for name, value in targets.items()},
            }
        )

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(
            json.dumps({"published": self.entries}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
