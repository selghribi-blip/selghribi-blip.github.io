"""اختبارات new_post.py | Unit tests for scripts/new_post.py."""

import os
from datetime import datetime

import pytest

import new_post


class TestSlugify:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("Hello World", "hello-world"),
            ("  Trim   Me  ", "trim-me"),
            ("Hello_World", "hello-world"),
            ("Hello -- World", "hello-world"),
            ("Hello, World! (2026)", "hello-world-2026"),
            ("--edges--", "edges"),
            ("already-a-slug", "already-a-slug"),
            ("", ""),
        ],
    )
    def test_normalizes_text(self, raw, expected):
        assert new_post.slugify(raw) == expected

    def test_keeps_unicode_word_characters(self):
        assert new_post.slugify("مقالة جديدة") == "مقالة-جديدة"

    def test_truncates_to_60_characters(self):
        slug = new_post.slugify("a" * 100)
        assert len(slug) == 60

    def test_punctuation_only_becomes_empty(self):
        assert new_post.slugify("!!!???") == ""


class TestChoices:
    def test_categories_are_unique_and_non_empty(self):
        cats = new_post.get_available_categories()
        assert cats == sorted(set(cats), key=cats.index)
        assert all(cat and cat.islower() for cat in cats)
        assert "tutorial" in cats

    def test_languages(self):
        assert new_post.get_available_languages() == ["ar", "en", "fr"]


class TestCreatePostFile:
    def _create(self, tmp_path, **overrides):
        kwargs = {
            "title": "عنوان",
            "title_en": "Title",
            "slug": "my-post",
            "lang": "ar",
            "categories": ["tutorial", "python"],
            "tags": ["a", "b"],
            "description": "Some description",
            "posts_dir": str(tmp_path / "_posts"),
        }
        kwargs.update(overrides)
        return new_post.create_post_file(**kwargs)

    def test_creates_file_named_with_todays_date(self, tmp_path):
        path = self._create(tmp_path)
        expected_name = f"{datetime.now().strftime('%Y-%m-%d')}-my-post.md"
        assert os.path.basename(path) == expected_name
        assert os.path.isfile(path)

    def test_creates_missing_posts_directory(self, tmp_path):
        posts_dir = tmp_path / "nested" / "_posts"
        path = self._create(tmp_path, posts_dir=str(posts_dir))
        assert os.path.dirname(path) == str(posts_dir)
        assert posts_dir.is_dir()

    def test_front_matter_contents(self, tmp_path):
        path = self._create(tmp_path)
        content = open(path, encoding="utf-8").read()
        assert content.startswith("---\n")
        assert 'title: "عنوان"' in content
        assert 'title_en: "Title"' in content
        assert "categories: [tutorial, python]" in content
        assert "tags: [a, b]" in content
        assert 'description: "Some description"' in content
        assert "image: /assets/images/og/my-post.png" in content
        assert "lang: ar" in content

    def test_body_template_included(self, tmp_path):
        content = open(self._create(tmp_path), encoding="utf-8").read()
        assert "## المقدمة | Introduction" in content
        assert "## الخلاصة | Conclusion" in content

    def test_empty_categories_and_tags_render_empty_lists(self, tmp_path):
        content = open(
            self._create(tmp_path, categories=[], tags=[]), encoding="utf-8"
        ).read()
        assert "categories: []" in content
        assert "tags: []" in content

    def test_overwrites_existing_file_when_confirmed(self, tmp_path, monkeypatch):
        path = self._create(tmp_path)
        monkeypatch.setattr("builtins.input", lambda *_: "y")
        again = self._create(tmp_path, description="Updated description")
        assert again == path
        assert "Updated description" in open(path, encoding="utf-8").read()

    def test_exits_when_overwrite_declined(self, tmp_path, monkeypatch):
        self._create(tmp_path)
        monkeypatch.setattr("builtins.input", lambda *_: "n")
        with pytest.raises(SystemExit) as exc:
            self._create(tmp_path)
        assert exc.value.code == 0


class TestInteractiveMode:
    @staticmethod
    def _answers(monkeypatch, answers):
        it = iter(answers)
        monkeypatch.setattr("builtins.input", lambda *_: next(it))

    def test_collects_all_values(self, monkeypatch):
        self._answers(
            monkeypatch,
            ["عنوان", "English Title", "", "2", "1,3", "x, y", "desc"],
        )
        data = new_post.interactive_mode()
        assert data == {
            "title": "عنوان",
            "title_en": "English Title",
            "slug": "english-title",
            "lang": "en",
            "categories": ["tutorial", "automation"],
            "tags": ["x", "y"],
            "description": "desc",
        }

    def test_falls_back_to_defaults(self, monkeypatch):
        self._answers(monkeypatch, ["عنوان", "", "", "", "", "", ""])
        data = new_post.interactive_mode()
        assert data["title_en"] == "عنوان"
        assert data["lang"] == "ar"
        assert data["categories"] == ["tutorial"]
        assert data["tags"] == ["tutorial"]
        assert data["description"] == "عنوان"

    def test_explicit_slug_is_slugified(self, monkeypatch):
        self._answers(
            monkeypatch, ["عنوان", "Title", "My Custom Slug", "1", "1", "", ""]
        )
        assert new_post.interactive_mode()["slug"] == "my-custom-slug"

    def test_generated_slug_when_unusable(self, monkeypatch):
        self._answers(monkeypatch, ["عنوان", "???", "", "1", "1", "", ""])
        assert new_post.interactive_mode()["slug"].startswith("new-post-")

    def test_out_of_range_choices_are_ignored(self, monkeypatch):
        self._answers(monkeypatch, ["عنوان", "Title", "", "99", "0,99,abc", "", ""])
        data = new_post.interactive_mode()
        assert data["lang"] == "ar"
        assert data["categories"] == ["tutorial"]

    def test_missing_title_exits(self, monkeypatch):
        self._answers(monkeypatch, ["   "])
        with pytest.raises(SystemExit) as exc:
            new_post.interactive_mode()
        assert exc.value.code == 1


class TestMain:
    def test_command_line_mode(self, tmp_path, monkeypatch, capsys):
        posts_dir = tmp_path / "_posts"
        monkeypatch.setattr(
            "sys.argv",
            [
                "new_post.py",
                "--title",
                "عنوان",
                "--title-en",
                "My New Post",
                "--lang",
                "en",
                "--category",
                "python",
                "--tags",
                "one, two",
                "--description",
                "desc",
                "--posts-dir",
                str(posts_dir),
            ],
        )
        new_post.main()

        created = list(posts_dir.glob("*.md"))
        assert len(created) == 1
        assert created[0].name.endswith("-my-new-post.md")
        content = created[0].read_text(encoding="utf-8")
        assert "categories: [python]" in content
        assert "tags: [one, two]" in content
        assert "lang: en" in content
        assert "Post created" in capsys.readouterr().out

    def test_command_line_mode_defaults(self, tmp_path, monkeypatch):
        posts_dir = tmp_path / "_posts"
        monkeypatch.setattr(
            "sys.argv",
            ["new_post.py", "--title", "Fallback Title", "--posts-dir", str(posts_dir)],
        )
        new_post.main()

        content = next(posts_dir.glob("*.md")).read_text(encoding="utf-8")
        assert 'title_en: "Fallback Title"' in content
        assert "categories: [tutorial]" in content
        assert "tags: [tutorial]" in content
        assert 'description: "Fallback Title"' in content

    def test_falls_back_to_interactive_mode(self, tmp_path, monkeypatch):
        posts_dir = tmp_path / "_posts"
        monkeypatch.setattr(
            "sys.argv", ["new_post.py", "--posts-dir", str(posts_dir)]
        )
        monkeypatch.setattr(
            new_post,
            "interactive_mode",
            lambda: {
                "title": "T",
                "title_en": "T",
                "slug": "interactive-post",
                "lang": "fr",
                "categories": ["design"],
                "tags": ["t"],
                "description": "d",
            },
        )
        new_post.main()
        assert next(posts_dir.glob("*.md")).name.endswith("-interactive-post.md")

    def test_invalid_language_rejected(self, monkeypatch):
        monkeypatch.setattr(
            "sys.argv", ["new_post.py", "--title", "T", "--lang", "de"]
        )
        with pytest.raises(SystemExit) as exc:
            new_post.main()
        assert exc.value.code == 2
