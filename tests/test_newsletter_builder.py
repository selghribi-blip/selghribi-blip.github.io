"""اختبارات newsletter_builder.py | Unit tests for scripts/newsletter_builder.py."""

import os
from datetime import datetime, timedelta

import pytest

import newsletter_builder as nb


class TestParseFrontMatter:
    def test_parses_keys_content_and_excerpt(self, write_post, sample_post_body):
        path = write_post("2026-03-10-hello-morocco.md", sample_post_body)
        meta = nb.parse_front_matter(path)

        assert meta["_filepath"] == path
        assert meta["title"] == "Hello Morocco"
        assert meta["description"] == "A short description"
        assert meta["lang"] == "ar"
        assert meta["_content"].startswith("# Heading")
        assert "Fourth paragraph" not in meta["_excerpt"]
        assert "Heading" not in meta["_excerpt"]
        assert "markdown" in meta["_excerpt"]
        assert "*" not in meta["_excerpt"]
        assert "[" not in meta["_excerpt"] and "(" not in meta["_excerpt"]

    def test_missing_file_returns_only_filepath(self, tmp_path):
        missing = str(tmp_path / "nope.md")
        assert nb.parse_front_matter(missing) == {"_filepath": missing}

    def test_file_without_front_matter(self, write_post):
        path = write_post("2026-03-10-plain.md", "just text\n")
        assert nb.parse_front_matter(path) == {"_filepath": path}

    def test_unterminated_front_matter(self, write_post):
        path = write_post("2026-03-10-broken.md", "---\ntitle: X\n")
        assert nb.parse_front_matter(path) == {"_filepath": path}

    def test_long_excerpt_is_truncated_with_ellipsis(self, write_post):
        body = "---\ntitle: X\n---\n\n" + ("word " * 200)
        path = write_post("2026-03-10-long.md", body)
        excerpt = nb.parse_front_matter(path)["_excerpt"]
        assert len(excerpt) == 203
        assert excerpt.endswith("...")

    def test_empty_body_has_no_excerpt(self, write_post):
        path = write_post("2026-03-10-empty.md", "---\ntitle: X\n---\n\n")
        meta = nb.parse_front_matter(path)
        assert meta["_content"] == ""
        assert "_excerpt" not in meta


class TestGetRecentPosts:
    def _post(self, write_post, date: datetime, slug: str):
        return write_post(
            f"{date.strftime('%Y-%m-%d')}-{slug}.md",
            f'---\ntitle: "{slug}"\n---\n\nbody text\n',
        )

    def test_filters_by_cutoff_date(self, write_post):
        now = datetime.now()
        self._post(write_post, now - timedelta(days=2), "recent")
        path = self._post(write_post, now - timedelta(days=40), "old")
        posts_dir = os.path.dirname(path)

        posts = nb.get_recent_posts(posts_dir, 7)
        assert [p["_slug"] for p in posts] == ["recent"]

    def test_returns_newest_first(self, write_post):
        now = datetime.now()
        self._post(write_post, now - timedelta(days=1), "newer")
        path = self._post(write_post, now - timedelta(days=3), "older")
        posts_dir = os.path.dirname(path)

        posts = nb.get_recent_posts(posts_dir, 30)
        assert [p["_slug"] for p in posts] == ["newer", "older"]
        assert all(isinstance(p["_date"], datetime) for p in posts)

    def test_skips_files_with_invalid_names(self, write_post):
        path = write_post("not-a-post.md", "---\ntitle: X\n---\n\nbody\n")
        write_post("2026-99-99-bad-date.md", "---\ntitle: Y\n---\n\nbody\n")
        posts_dir = os.path.dirname(path)
        assert nb.get_recent_posts(posts_dir, 100000) == []

    def test_skips_filenames_without_date_parts(self, write_post):
        path = write_post("draft.md", "---\ntitle: X\n---\n\nbody\n")
        assert nb.get_recent_posts(os.path.dirname(path), 100000) == []

    def test_slug_falls_back_to_stem(self, write_post):
        now = datetime.now()
        path = write_post(
            f"{now.strftime('%Y-%m-%d')}.md", "---\ntitle: X\n---\n\nbody\n"
        )
        posts_dir = os.path.dirname(path)
        posts = nb.get_recent_posts(posts_dir, 7)
        assert posts[0]["_slug"] == now.strftime("%Y-%m-%d")

    def test_empty_directory(self, tmp_path):
        assert nb.get_recent_posts(str(tmp_path), 7) == []


class TestBuildPostUrl:
    def test_zero_pads_month_and_day(self):
        meta = {"_date": datetime(2026, 3, 5), "_slug": "welcome"}
        assert (
            nb.build_post_url(meta)
            == "https://artsmoroccan.me/blog/2026/03/05/welcome/"
        )

    def test_custom_base_url(self):
        meta = {"_date": datetime(2026, 12, 31), "_slug": "end"}
        assert (
            nb.build_post_url(meta, "https://example.com")
            == "https://example.com/blog/2026/12/31/end/"
        )

    def test_defaults_when_metadata_missing(self):
        url = nb.build_post_url({})
        today = datetime.now()
        assert url == f"https://artsmoroccan.me/blog/{today.year}/{today.month:02d}/{today.day:02d}/post/"


class TestBuildHtmlNewsletter:
    def test_renders_each_post(self):
        posts = [
            {
                "title": '"Quoted Title"',
                "description": "The description",
                "categories": "tutorial",
                "_date": datetime(2026, 3, 10),
                "_slug": "first",
            },
            {
                "title": "Second",
                "_excerpt": "Excerpt used as description",
                "_date": datetime(2026, 3, 1),
                "_slug": "second",
            },
        ]
        html = nb.build_html_newsletter(posts)

        assert html.startswith("<!DOCTYPE html>")
        assert 'dir="rtl"' in html
        assert "Quoted Title" in html and '"Quoted Title"' not in html
        assert "The description" in html
        assert "Excerpt used as description" in html
        assert "https://artsmoroccan.me/blog/2026/03/10/first/" in html
        assert "https://artsmoroccan.me/blog/2026/03/01/second/" in html
        assert html.count("اقرأ المقالة") == 2
        assert "tutorial" in html
        assert str(datetime.now().year) in html

    def test_empty_state_when_no_posts(self):
        html = nb.build_html_newsletter([])
        assert "لا توجد مقالات جديدة هذا الأسبوع" in html
        assert "اقرأ المقالة" not in html

    def test_uses_custom_base_url_in_footer_links(self):
        html = nb.build_html_newsletter([], "https://example.com")
        assert 'href="https://example.com/blog"' in html
        assert "artsmoroccan.me" not in html

    def test_unsubscribe_placeholder_is_literal(self):
        assert 'href="{{ unsubscribe }}"' in nb.build_html_newsletter([])

    def test_truncates_long_description(self):
        posts = [{"title": "T", "description": "x" * 500, "_slug": "s", "_date": datetime(2026, 3, 10)}]
        html = nb.build_html_newsletter(posts)
        assert "x" * 200 + "..." in html
        assert "x" * 201 not in html

    def test_category_block_omitted_when_absent(self):
        html = nb.build_html_newsletter(
            [{"title": "T", "_slug": "s", "_date": datetime(2026, 3, 10)}]
        )
        assert "text-transform:uppercase" not in html


class TestMain:
    def _argv(self, monkeypatch, *args):
        monkeypatch.setattr("sys.argv", ["newsletter_builder.py", *args])

    def test_writes_newsletter_file(self, write_post, tmp_path, monkeypatch, capsys):
        now = datetime.now()
        path = write_post(
            f"{now.strftime('%Y-%m-%d')}-fresh.md",
            '---\ntitle: "Fresh Post"\n---\n\nbody\n',
        )
        posts_dir = os.path.dirname(path)
        output = tmp_path / "out.html"

        self._argv(
            monkeypatch,
            "--posts-dir", posts_dir,
            "--output", str(output),
            "--since", "7",
        )
        nb.main()

        html = output.read_text(encoding="utf-8")
        assert "Fresh Post" in html
        out = capsys.readouterr().out
        assert "Found 1 posts" in out

    def test_missing_posts_dir_exits(self, tmp_path, monkeypatch, capsys):
        self._argv(monkeypatch, "--posts-dir", str(tmp_path / "missing"))
        with pytest.raises(SystemExit) as exc:
            nb.main()
        assert exc.value.code == 1
        assert "Posts dir not found" in capsys.readouterr().out

    def test_send_flag_prints_warning(self, tmp_path, monkeypatch, capsys):
        posts_dir = tmp_path / "_posts"
        posts_dir.mkdir()
        self._argv(
            monkeypatch,
            "--posts-dir", str(posts_dir),
            "--output", str(tmp_path / "out.html"),
            "--send",
        )
        nb.main()
        assert "Send function needs API key setup" in capsys.readouterr().out
