"""اختبارات مصنع المحتوى | Tests for the AI content factory (no network calls)."""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ai_factory import ads, generator, runner  # noqa: E402
from ai_factory.config import AdSnippets, Settings  # noqa: E402
from ai_factory.publishers.blogger import BloggerPublisher, _markdown_to_html  # noqa: E402
from ai_factory.publishers.jekyll import JekyllPublisher  # noqa: E402
from ai_factory.state import State  # noqa: E402

ARTICLE_BODY = "\n\n".join(
    ["Intro paragraph."]
    + ["## Section {0}\n\n{1}".format(index, " ".join(["word"] * 80)) for index in range(1, 5)]
)


def make_topic(mode: str = "article") -> generator.Topic:
    return generator.Topic.from_dict(
        {
            "keyword": "best free ai tools",
            "language": "en",
            "angle": "comparison",
            "audience": "founders",
            "categories": ["tools"],
            "mode": mode,
        }
    )


def make_settings(tmp_path: Path, snippets: AdSnippets = None) -> Settings:
    return Settings(
        posts_dir=tmp_path / "_posts",
        pages_dir=tmp_path / "ai-pages",
        state_file=tmp_path / "state.json",
        topics_file=tmp_path / "topics.yml",
        ads=snippets or AdSnippets(),
    )


def article_payload(**overrides) -> str:
    payload = {
        "title": "Best Free AI Tools",
        "title_en": "Best Free AI Tools",
        "slug": "best-free-ai-tools",
        "description": "A practical comparison of free AI tools.",
        "tags": ["ai", "tools"],
        "body": ARTICLE_BODY,
    }
    payload.update(overrides)
    return json.dumps(payload)


class TestGenerator:
    def test_parses_json_wrapped_in_fences(self):
        content = generator._parse_article_payload(
            "```json\n" + article_payload() + "\n```", make_topic()
        )
        assert content.title == "Best Free AI Tools"
        assert content.slug == "best-free-ai-tools"
        assert content.read_time >= 1

    def test_rejects_thin_article(self):
        with pytest.raises(generator.GenerationError):
            generator._parse_article_payload(article_payload(body="too short"), make_topic())

    def test_rejects_non_json(self):
        with pytest.raises(generator.GenerationError):
            generator._parse_article_payload("Sure! Here is your article.", make_topic())

    def test_slug_falls_back_to_keyword_for_non_latin_titles(self):
        content = generator._parse_article_payload(article_payload(slug="عنوان عربي"), make_topic())
        assert content.slug == "best-free-ai-tools"

    def test_generate_page_requires_full_document(self, monkeypatch):
        monkeypatch.setattr(generator, "complete", lambda *a, **k: "<div>partial</div>")
        with pytest.raises(generator.GenerationError):
            generator.generate_page(Settings(), make_topic("page"))

    def test_generate_page_extracts_metadata(self, monkeypatch):
        html = (
            '<!DOCTYPE html><html lang="en"><head><title>AI Toolkit</title>'
            '<meta name="description" content="A toolkit page."></head>'
            "<body><h1>Hi</h1></body></html>"
        )
        monkeypatch.setattr(generator, "complete", lambda *a, **k: "```html\n" + html + "\n```")
        content = generator.generate_page(Settings(), make_topic("page"))
        assert content.title == "AI Toolkit"
        assert content.description == "A toolkit page."
        assert content.html_page.startswith("<!DOCTYPE html>")


class TestAds:
    snippets = AdSnippets(header="<!--top-->", in_article="<!--mid-->", footer="<!--bottom-->")

    def test_markdown_injection_places_mid_slot_inside_content(self):
        result = ads.inject_markdown(ARTICLE_BODY, self.snippets)
        assert result.startswith("<!--top-->")
        assert result.rstrip().endswith("<!--bottom-->")
        assert result.index("## Section 1") < result.index("<!--mid-->") < result.index("## Section 2")

    def test_markdown_injection_is_noop_without_snippets(self):
        assert ads.inject_markdown(ARTICLE_BODY, AdSnippets()) == ARTICLE_BODY

    def test_html_injection_respects_body_tags(self):
        html = '<!DOCTYPE html><html><body class="x"><main>hi</main></body></html>'
        result = ads.inject_html(html, self.snippets)
        assert result.index('<body class="x">') < result.index("<!--top-->") < result.index("<main>")
        assert result.index("<!--mid-->") < result.index("</body>")
        assert result.index("<!--bottom-->") < result.index("</body>")

    def test_html_injection_without_body_tag(self):
        result = ads.inject_html("<div>hi</div>", self.snippets)
        assert "<!--top-->" in result and "<!--bottom-->" in result


class TestJekyllPublisher:
    def test_writes_post_with_front_matter(self, tmp_path):
        settings = make_settings(tmp_path, AdSnippets(header="<!--top-->"))
        content = generator._parse_article_payload(article_payload(), make_topic())
        path = Path(JekyllPublisher(settings).publish(content, today=date(2026, 5, 1)))
        text = path.read_text(encoding="utf-8")
        assert path.name == "2026-05-01-best-free-ai-tools.md"
        assert text.startswith("---\nlayout: post\n")
        assert 'title: "Best Free AI Tools"' in text
        assert "generated_by: ai-factory" in text
        assert "<!--top-->" in text

    def test_quotes_are_escaped_in_front_matter(self, tmp_path):
        content = generator._parse_article_payload(
            article_payload(title='He said "hi"', description="a\nb"), make_topic()
        )
        rendered = JekyllPublisher(make_settings(tmp_path)).render_post(content, date(2026, 5, 1))
        assert "title: \"He said 'hi'\"" in rendered
        assert 'description: "a b"' in rendered

    def test_page_mode_writes_html(self, tmp_path):
        settings = make_settings(tmp_path)
        content = generator.Content(
            topic=make_topic("page"),
            title="AI Toolkit",
            title_en="AI Toolkit",
            slug="ai-toolkit",
            description="d",
            tags=["ai"],
            html_page="<!DOCTYPE html><html><body>hi</body></html>",
        )
        path = Path(JekyllPublisher(settings).publish(content))
        assert path.suffix == ".html"
        assert "<!DOCTYPE html>" in path.read_text(encoding="utf-8")

    def test_dry_run_writes_nothing(self, tmp_path):
        settings = make_settings(tmp_path)
        content = generator._parse_article_payload(article_payload(), make_topic())
        JekyllPublisher(settings, dry_run=True).publish(content, today=date(2026, 5, 1))
        assert not settings.posts_dir.exists()


class TestBloggerPublisher:
    def test_markdown_to_html_covers_generator_subset(self):
        html = _markdown_to_html(
            "## Title\n\n- one\n- two\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\n"
            "Text with **bold**, *italic*, `code` and [link](https://x.dev)."
        )
        assert "<h2>Title</h2>" in html
        assert html.count("<li>") == 2 and "<ul>" in html and "</ul>" in html
        assert "<table" in html and "<td>1</td>" in html and "</table>" in html
        assert "<strong>bold</strong>" in html and "<em>italic</em>" in html
        assert '<a href="https://x.dev">link</a>' in html
        assert "| --- |" not in html

    def test_publish_requires_credentials(self, tmp_path):
        content = generator._parse_article_payload(article_payload(), make_topic())
        with pytest.raises(Exception) as excinfo:
            BloggerPublisher(make_settings(tmp_path)).publish(content)
        assert "not configured" in str(excinfo.value)

    def test_dry_run_skips_network(self, tmp_path):
        content = generator._parse_article_payload(article_payload(), make_topic())
        assert BloggerPublisher(make_settings(tmp_path), dry_run=True).publish(content).startswith("dry-run://")


class TestRunner:
    topics_yaml = (
        "- keyword: alpha topic\n  language: en\n  mode: article\n"
        "- keyword: beta topic\n  language: en\n  mode: article\n"
    )

    def _settings(self, tmp_path):
        settings = make_settings(tmp_path)
        settings.topics_file.write_text(self.topics_yaml, encoding="utf-8")
        return settings

    def test_skips_already_published_topics(self, tmp_path):
        settings = self._settings(tmp_path)
        state = State(settings.state_file)
        state.record("en|article|alpha topic", "Alpha", {"jekyll": "_posts/x.md"})
        state.save()
        pending = runner.pending_topics(settings, State(settings.state_file), 5)
        assert [topic.keyword for topic in pending] == ["beta topic"]

    def test_run_publishes_and_records_state(self, tmp_path, monkeypatch):
        settings = self._settings(tmp_path)
        monkeypatch.setattr(
            runner, "generate", lambda s, t: generator._parse_article_payload(article_payload(), t)
        )
        results = runner.run(settings, ["jekyll"], count=1)
        assert len(results) == 1
        assert list(results[0].targets) == ["jekyll"]
        assert State(settings.state_file).published_keys == {"en|article|alpha topic"}

    def test_one_failing_target_does_not_block_the_other(self, tmp_path, monkeypatch):
        settings = self._settings(tmp_path)
        monkeypatch.setattr(
            runner, "generate", lambda s, t: generator._parse_article_payload(article_payload(), t)
        )
        results = runner.run(settings, ["jekyll", "blogger"], count=1)
        assert results[0].targets["blogger"].startswith("error:")
        assert results[0].targets["jekyll"].endswith(".md")

    def test_unknown_target_raises(self, tmp_path):
        with pytest.raises(ValueError):
            runner.run(self._settings(tmp_path), ["telegram"])

    def test_empty_queue_returns_no_results(self, tmp_path):
        settings = self._settings(tmp_path)
        settings.topics_file.write_text("[]\n", encoding="utf-8")
        assert runner.run(settings, ["jekyll"]) == []
