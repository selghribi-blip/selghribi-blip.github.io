"""إعدادات مشتركة للاختبارات | Shared test fixtures."""

import textwrap

import pytest


@pytest.fixture
def write_post(tmp_path):
    """كتابة ملف مقالة مؤقت | Write a temporary post file and return its path."""

    def _write(name: str, body: str) -> str:
        posts_dir = tmp_path / "_posts"
        posts_dir.mkdir(exist_ok=True)
        path = posts_dir / name
        path.write_text(textwrap.dedent(body).lstrip(), encoding="utf-8")
        return str(path)

    return _write


@pytest.fixture
def sample_post_body():
    return """
    ---
    layout: post
    title: "Hello Morocco"
    description: "A short description"
    date: 2026-03-10
    categories: [tutorial, github]
    tags: [jekyll, automation]
    lang: ar
    ---

    # Heading

    First paragraph of the article.
    Second paragraph with *markdown* and [a link](https://example.com).
    Third paragraph.
    Fourth paragraph should be ignored in the excerpt.
    """
