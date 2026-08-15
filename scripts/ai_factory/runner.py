"""مشغّل مصنع المحتوى | Orchestrates generation and publishing."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, List, Sequence

import yaml

from .config import Settings
from .generator import Content, Topic, generate
from .publishers.blogger import BloggerPublisher
from .publishers.jekyll import JekyllPublisher
from .state import State

LOGGER = logging.getLogger(__name__)

PUBLISHERS = {"jekyll": JekyllPublisher, "blogger": BloggerPublisher}


@dataclass
class Result:
    topic: Topic
    content: Content
    targets: Dict[str, str]


def load_topics(settings: Settings) -> List[Topic]:
    raw = yaml.safe_load(settings.topics_file.read_text(encoding="utf-8")) or []
    return [Topic.from_dict(item) for item in raw]


def pending_topics(settings: Settings, state: State, count: int) -> List[Topic]:
    done = state.published_keys
    return [topic for topic in load_topics(settings) if topic.key not in done][:count]


def run(
    settings: Settings,
    targets: Sequence[str],
    count: int = 1,
    dry_run: bool = False,
    draft: bool = False,
) -> List[Result]:
    """توليد ونشر `count` موضوعاً | Generate and publish up to `count` topics."""
    unknown = [target for target in targets if target not in PUBLISHERS]
    if unknown:
        raise ValueError("unknown targets: {0}".format(", ".join(unknown)))

    state = State(settings.state_file)
    topics = pending_topics(settings, state, count)
    if not topics:
        LOGGER.warning("no pending topics left in %s", settings.topics_file)
        return []

    publishers = [PUBLISHERS[name](settings, dry_run=dry_run) for name in targets]
    results: List[Result] = []
    for topic in topics:
        LOGGER.info("--- topic: %s (%s, %s)", topic.keyword, topic.language, topic.mode)
        content = generate(settings, topic)
        published: Dict[str, str] = {}
        for publisher in publishers:
            try:
                if isinstance(publisher, BloggerPublisher):
                    published[publisher.name] = publisher.publish(content, is_draft=draft)
                else:
                    published[publisher.name] = publisher.publish(content)
            except Exception as exc:  # keep other targets working
                LOGGER.error("publisher %s failed: %s", publisher.name, exc)
                published[publisher.name] = "error: {0}".format(exc)
        if not dry_run and any(not value.startswith("error:") for value in published.values()):
            state.record(topic.key, content.title, published)
        results.append(Result(topic=topic, content=content, targets=published))

    if not dry_run:
        state.save()
    return results
