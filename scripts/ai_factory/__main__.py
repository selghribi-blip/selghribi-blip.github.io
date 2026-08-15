"""واجهة سطر الأوامر | CLI: PYTHONPATH=scripts python -m ai_factory --help"""

from __future__ import annotations

import argparse
import logging
import sys

from .config import Settings
from .runner import PUBLISHERS, pending_topics, run
from .state import State


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ai_factory",
        description="توليد ونشر المحتوى تلقائياً | Generate and publish AI content",
    )
    parser.add_argument("--count", type=int, default=1, help="عدد المواضيع | topics to publish")
    parser.add_argument(
        "--targets",
        default="jekyll",
        help="أهداف النشر مفصولة بفاصلة | comma separated: {0}".format(",".join(PUBLISHERS)),
    )
    parser.add_argument("--dry-run", action="store_true", help="بدون كتابة أو نشر | generate only")
    parser.add_argument("--draft", action="store_true", help="نشر كمسودة على Blogger | Blogger draft")
    parser.add_argument("--list-pending", action="store_true", help="عرض المواضيع المتبقية | list queue")
    parser.add_argument("--verbose", action="store_true")
    return parser


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    settings = Settings.from_env()

    if args.list_pending:
        for topic in pending_topics(settings, State(settings.state_file), args.count or 100):
            print("{0}\t{1}\t{2}".format(topic.language, topic.mode, topic.keyword))
        return 0

    if not settings.has_llm:
        print("error: set GOOGLE_API_KEY (or OPENROUTER_API_KEY) first", file=sys.stderr)
        return 2

    targets = [target.strip() for target in args.targets.split(",") if target.strip()]
    results = run(settings, targets, count=args.count, dry_run=args.dry_run, draft=args.draft)
    if not results:
        print("nothing to publish: the topic queue in scripts/ai_factory/topics.yml is exhausted")
        return 0

    failed = False
    for result in results:
        print("\n{0}".format(result.content.title))
        for name, value in result.targets.items():
            print("  {0}: {1}".format(name, value))
            failed = failed or value.startswith("error:")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
