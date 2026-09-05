"""اختبارات social_poster.py | Unit tests for scripts/social_poster.py."""

import builtins
import json
import sys
from datetime import datetime

import pytest

import social_poster as sp

TWITTER_ENV = {
    "TWITTER_API_KEY": "key",
    "TWITTER_API_SECRET": "secret",
    "TWITTER_ACCESS_TOKEN": "token",
    "TWITTER_ACCESS_SECRET": "token-secret",
}


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for name in (*TWITTER_ENV, "LINKEDIN_ACCESS_TOKEN", "LINKEDIN_USER_ID"):
        monkeypatch.delenv(name, raising=False)


class TestParseFrontMatter:
    def test_parses_scalars_and_arrays(self, write_post, sample_post_body):
        meta = sp.parse_front_matter(
            write_post("2026-03-10-hello-morocco.md", sample_post_body)
        )
        assert meta["title"] == "Hello Morocco"
        assert meta["description"] == "A short description"
        assert meta["date"] == "2026-03-10"
        assert meta["tags"] == ["jekyll", "automation"]
        assert meta["categories"] == ["tutorial", "github"]

    def test_quoted_array_items_are_unquoted(self, write_post):
        meta = sp.parse_front_matter(
            write_post(
                "2026-03-10-quoted.md", '---\ntitle: T\ntags: ["a b", \'c\']\n---\n\nx\n'
            )
        )
        assert meta["tags"] == ["a b", "c"]

    def test_missing_file_returns_empty(self, tmp_path, capsys):
        assert sp.parse_front_matter(str(tmp_path / "nope.md")) == {}
        assert "File not found" in capsys.readouterr().out

    def test_no_front_matter(self, write_post):
        assert sp.parse_front_matter(write_post("2026-03-10-p.md", "text\n")) == {}

    def test_unterminated_front_matter(self, write_post):
        assert sp.parse_front_matter(write_post("2026-03-10-p.md", "---\ntitle: T\n")) == {}


class TestBuildPostUrl:
    def test_builds_url_from_date_and_title(self):
        meta = {"date": "2026-03-10", "title": "Hello World"}
        assert (
            sp.build_post_url(meta) == "https://artsmoroccan.me/blog/2026/03/10/hello-world/"
        )

    def test_strips_time_from_date(self):
        meta = {"date": "2026-03-10 09:30:00 +0100", "title": "T"}
        assert sp.build_post_url(meta).startswith("https://artsmoroccan.me/blog/2026/03/10/")

    def test_custom_base_url(self):
        meta = {"date": "2026-01-02", "title": "X"}
        assert sp.build_post_url(meta, "https://example.com").startswith("https://example.com/blog/")

    def test_title_slug_drops_punctuation_and_truncates(self):
        meta = {"date": "2026-03-10", "title": "Hello, World! " + "a" * 100}
        slug = sp.build_post_url(meta).rsplit("/", 2)[1]
        assert slug.startswith("hello-world-")
        assert len(slug) <= 50

    def test_arabic_title_is_preserved(self):
        meta = {"date": "2026-03-10", "title": "مقالة جديدة"}
        assert sp.build_post_url(meta).endswith("/مقالة-جديدة/")

    def test_defaults_to_today_when_date_missing(self):
        today = datetime.now()
        url = sp.build_post_url({"title": "T"})
        assert f"/blog/{today.strftime('%Y-%m-%d').replace('-', '/')}/" in url

    def test_malformed_date_still_returns_url(self):
        # التاريخ غير المكتمل يستخدم المسار الاحتياطي | Incomplete date uses the fallback branch
        url = sp.build_post_url({"date": "2026", "title": "T"})
        assert url.startswith("https://artsmoroccan.me/blog/")
        assert url.endswith("/t/")


class TestBuildTwitterText:
    def test_includes_title_description_url_and_hashtags(self):
        meta = {"title": '"Hello"', "description": "Desc", "tags": ["a", "b", "c", "d", "e"]}
        text = sp.build_twitter_text(meta, "https://example.com/p/")

        assert "📝 Hello" in text
        assert "Desc..." in text
        assert "🔗 https://example.com/p/" in text
        assert "#a #b #c #d" in text
        assert "#e" not in text
        assert "#Morocco" in text

    def test_respects_280_char_limit(self):
        meta = {"title": "T" * 400, "description": "D" * 400, "tags": ["x"]}
        assert len(sp.build_twitter_text(meta, "https://example.com/")) == 280

    def test_defaults_without_metadata(self):
        text = sp.build_twitter_text({}, "https://example.com/")
        assert "مقالة جديدة" in text
        assert "..." not in text

    def test_description_truncated_to_100_chars(self):
        text = sp.build_twitter_text({"title": "T", "description": "d" * 150}, "u")
        assert "d" * 100 + "..." in text
        assert "d" * 101 not in text


class TestBuildLinkedinText:
    def test_includes_title_description_url_and_hashtags(self):
        meta = {"title": "Hello", "description": "Desc", "tags": [f"t{i}" for i in range(8)]}
        text = sp.build_linkedin_text(meta, "https://example.com/p/")

        assert "**Hello**" in text
        assert "Desc" in text
        assert "https://example.com/p/" in text
        assert "#t5" in text
        assert "#t6" not in text
        assert text.endswith("#Arabic #Morocco #WebDevelopment #GitHub #OpenSource")

    def test_no_description_or_tags(self):
        text = sp.build_linkedin_text({"title": "Hello"}, "u")
        assert "**Hello**" in text
        assert "#Arabic" in text

    def test_full_description_is_not_truncated(self):
        text = sp.build_linkedin_text({"title": "T", "description": "d" * 400}, "u")
        assert "d" * 400 in text


class FakeTweepyClient:
    created = None

    def __init__(self, **kwargs):
        FakeTweepyClient.kwargs = kwargs

    def create_tweet(self, text):
        FakeTweepyClient.created = text
        return type("R", (), {"data": {"id": "123"}})()


class TestPostToTwitter:
    def test_returns_false_without_credentials(self, capsys):
        assert sp.post_to_twitter("hi") is False
        assert "Twitter env vars not set" in capsys.readouterr().out

    def test_returns_false_with_partial_credentials(self, monkeypatch):
        monkeypatch.setenv("TWITTER_API_KEY", "key")
        assert sp.post_to_twitter("hi") is False

    def test_posts_tweet(self, monkeypatch, capsys):
        for name, value in TWITTER_ENV.items():
            monkeypatch.setenv(name, value)
        fake = type("M", (), {"Client": FakeTweepyClient})
        monkeypatch.setitem(sys.modules, "tweepy", fake)

        assert sp.post_to_twitter("hello tweet") is True
        assert FakeTweepyClient.created == "hello tweet"
        assert FakeTweepyClient.kwargs["consumer_key"] == "key"
        assert "status/123" in capsys.readouterr().out

    def test_returns_false_when_tweepy_missing(self, monkeypatch, capsys):
        for name, value in TWITTER_ENV.items():
            monkeypatch.setenv(name, value)
        real_import = builtins.__import__

        def fake_import(name, *args, **kwargs):
            if name == "tweepy":
                raise ImportError("no tweepy")
            return real_import(name, *args, **kwargs)

        monkeypatch.setattr(builtins, "__import__", fake_import)
        assert sp.post_to_twitter("hi") is False
        assert "tweepy not installed" in capsys.readouterr().out

    def test_handles_api_error(self, monkeypatch, capsys):
        for name, value in TWITTER_ENV.items():
            monkeypatch.setenv(name, value)

        class Boom:
            def __init__(self, **kwargs):
                raise RuntimeError("rate limited")

        monkeypatch.setitem(
            sys.modules, "tweepy", type("M", (), {"Client": Boom})
        )
        assert sp.post_to_twitter("hi") is False
        assert "rate limited" in capsys.readouterr().out


class TestPostToLinkedin:
    def test_returns_false_without_credentials(self, capsys):
        assert sp.post_to_linkedin("text", "url") is False
        assert "LinkedIn env vars not set" in capsys.readouterr().out

    def test_posts_payload(self, monkeypatch, capsys):
        monkeypatch.setenv("LINKEDIN_ACCESS_TOKEN", "tok")
        monkeypatch.setenv("LINKEDIN_USER_ID", "user42")
        captured = {}

        class Response:
            status = 201

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

        def fake_urlopen(req, timeout=None):
            captured["url"] = req.full_url
            captured["headers"] = req.headers
            captured["body"] = json.loads(req.data.decode("utf-8"))
            captured["timeout"] = timeout
            return Response()

        monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)

        assert sp.post_to_linkedin("my text", "https://example.com/p/") is True
        assert captured["url"] == "https://api.linkedin.com/v2/ugcPosts"
        assert captured["headers"]["Authorization"] == "Bearer tok"
        assert captured["body"]["author"] == "urn:li:person:user42"
        share = captured["body"]["specificContent"]["com.linkedin.ugc.ShareContent"]
        assert share["shareCommentary"]["text"] == "my text"
        assert share["media"][0]["originalUrl"] == "https://example.com/p/"
        assert captured["timeout"] == 30
        assert "201" in capsys.readouterr().out

    def test_handles_http_error(self, monkeypatch, capsys):
        monkeypatch.setenv("LINKEDIN_ACCESS_TOKEN", "tok")
        monkeypatch.setenv("LINKEDIN_USER_ID", "user42")

        def boom(req, timeout=None):
            raise OSError("connection reset")

        monkeypatch.setattr("urllib.request.urlopen", boom)
        assert sp.post_to_linkedin("t", "u") is False
        assert "connection reset" in capsys.readouterr().out


class TestLogPosting:
    def test_creates_log_file(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        sp.log_posting("_posts/p.md", ["twitter"], {"twitter": True})

        logs = json.loads((tmp_path / ".github/logs/social_posts.json").read_text(encoding="utf-8"))
        assert len(logs) == 1
        assert logs[0]["post"] == "_posts/p.md"
        assert logs[0]["platforms"] == ["twitter"]
        assert logs[0]["success"] == {"twitter": True}
        datetime.fromisoformat(logs[0]["timestamp"])

    def test_appends_to_existing_log(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        sp.log_posting("a.md", ["twitter"], {"twitter": True})
        sp.log_posting("b.md", ["linkedin"], {"linkedin": False})

        logs = json.loads((tmp_path / ".github/logs/social_posts.json").read_text(encoding="utf-8"))
        assert [entry["post"] for entry in logs] == ["a.md", "b.md"]

    def test_recovers_from_corrupt_log(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        log_file = tmp_path / ".github/logs/social_posts.json"
        log_file.parent.mkdir(parents=True)
        log_file.write_text("not json", encoding="utf-8")

        sp.log_posting("a.md", ["twitter"], {"twitter": True})
        logs = json.loads(log_file.read_text(encoding="utf-8"))
        assert len(logs) == 1


class TestMain:
    @pytest.fixture
    def post_file(self, write_post, sample_post_body):
        return write_post("2026-03-10-hello-morocco.md", sample_post_body)

    def _argv(self, monkeypatch, *args):
        monkeypatch.setattr("sys.argv", ["social_poster.py", *args])

    def test_dry_run_prints_both_platforms_without_posting(
        self, post_file, monkeypatch, capsys, tmp_path
    ):
        monkeypatch.chdir(tmp_path)
        called = []
        monkeypatch.setattr(sp, "post_to_twitter", lambda *a: called.append("t"))
        monkeypatch.setattr(sp, "post_to_linkedin", lambda *a: called.append("l"))
        self._argv(monkeypatch, "--post", post_file, "--dry-run")

        sp.main()

        out = capsys.readouterr().out
        assert "--- Twitter ---" in out and "--- LinkedIn ---" in out
        assert called == []
        assert not (tmp_path / ".github/logs/social_posts.json").exists()

    def test_single_platform_posts_and_logs(self, post_file, monkeypatch, tmp_path):
        monkeypatch.chdir(tmp_path)
        monkeypatch.setattr(sp, "post_to_twitter", lambda text: True)
        monkeypatch.setattr(
            sp, "post_to_linkedin", lambda *a: pytest.fail("linkedin should be skipped")
        )
        self._argv(monkeypatch, "--post", post_file, "--platform", "twitter")

        sp.main()

        logs = json.loads((tmp_path / ".github/logs/social_posts.json").read_text(encoding="utf-8"))
        assert logs[0]["platforms"] == ["twitter"]
        assert logs[0]["success"] == {"twitter": True}

    def test_all_platforms_post_and_log(self, post_file, monkeypatch, tmp_path):
        monkeypatch.chdir(tmp_path)
        monkeypatch.setattr(sp, "post_to_twitter", lambda text: True)
        monkeypatch.setattr(sp, "post_to_linkedin", lambda text, url: False)
        self._argv(monkeypatch, "--post", post_file, "--platform", "all")

        sp.main()

        logs = json.loads((tmp_path / ".github/logs/social_posts.json").read_text(encoding="utf-8"))
        assert logs[0]["platforms"] == ["twitter", "linkedin"]
        assert logs[0]["success"] == {"twitter": True, "linkedin": False}

    def test_missing_post_exits(self, monkeypatch, tmp_path, capsys):
        self._argv(monkeypatch, "--post", str(tmp_path / "nope.md"))
        with pytest.raises(SystemExit) as exc:
            sp.main()
        assert exc.value.code == 1
        assert "File not found" in capsys.readouterr().out

    def test_unknown_platform_rejected(self, post_file, monkeypatch):
        self._argv(monkeypatch, "--post", post_file, "--platform", "mastodon")
        with pytest.raises(SystemExit) as exc:
            sp.main()
        assert exc.value.code == 2
