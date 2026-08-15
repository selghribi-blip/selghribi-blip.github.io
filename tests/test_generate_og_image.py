"""اختبارات generate_og_image.py | Unit tests for scripts/generate_og_image.py."""

import builtins
import os

import pytest

import generate_og_image as og

PIL = pytest.importorskip("PIL", reason="Pillow is required for OG image tests")
from PIL import Image  # noqa: E402


class TestParseFrontMatter:
    def test_parses_front_matter_keys(self, write_post, sample_post_body):
        meta = og.parse_front_matter(
            write_post("2026-03-10-hello-morocco.md", sample_post_body)
        )
        assert meta["title"] == "Hello Morocco"
        assert meta["layout"] == "post"
        assert meta["lang"] == "ar"

    def test_no_front_matter(self, write_post):
        assert og.parse_front_matter(write_post("2026-03-10-p.md", "plain\n")) == {}

    def test_unterminated_front_matter(self, write_post):
        assert og.parse_front_matter(write_post("2026-03-10-p.md", "---\ntitle: T\n")) == {}

    def test_missing_file_raises(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            og.parse_front_matter(str(tmp_path / "nope.md"))


class TestGetSlugFromFilename:
    @pytest.mark.parametrize(
        ("path", "expected"),
        [
            ("_posts/2026-03-10-welcome.md", "welcome"),
            ("_posts/2026-03-10-multi-word-slug.md", "multi-word-slug"),
            ("/abs/path/2026-03-10-welcome.md", "welcome"),
            ("_posts/no-date-here.md", "no-date-here"),
            ("_posts/2026-03-10.md", "2026-03-10"),
        ],
    )
    def test_extracts_slug(self, path, expected):
        assert og.get_slug_from_filename(path) == expected


class TestGenerateOgImage:
    def test_creates_png_with_expected_dimensions(self, write_post, tmp_path, sample_post_body):
        post = write_post("2026-03-10-hello-morocco.md", sample_post_body)
        out_dir = tmp_path / "og"

        result = og.generate_og_image(post, str(out_dir))

        assert result == str(out_dir / "hello-morocco.png")
        with Image.open(result) as img:
            assert img.size == (og.OG_WIDTH, og.OG_HEIGHT)
            assert img.mode == "RGB"
            assert img.getpixel((0, og.OG_HEIGHT - 1)) == og.COLORS["gold"]

    def test_creates_output_directory(self, write_post, tmp_path, sample_post_body):
        post = write_post("2026-03-10-hello-morocco.md", sample_post_body)
        out_dir = tmp_path / "nested" / "og"
        og.generate_og_image(post, str(out_dir))
        assert out_dir.is_dir()

    def test_overwrites_existing_image(self, write_post, tmp_path, sample_post_body):
        post = write_post("2026-03-10-hello-morocco.md", sample_post_body)
        out_dir = tmp_path / "og"
        first = og.generate_og_image(post, str(out_dir))
        first_mtime = os.path.getmtime(first)
        os.utime(first, (first_mtime - 10, first_mtime - 10))

        og.generate_og_image(post, str(out_dir))
        assert os.path.getmtime(first) > first_mtime - 10

    def test_long_title_is_wrapped(self, write_post, tmp_path, monkeypatch):
        post = write_post(
            "2026-03-10-long-title.md",
            '---\ntitle: "' + " ".join(["word"] * 40) + '"\n---\n\nbody\n',
        )
        drawn = {}

        import PIL.ImageDraw

        real_text = PIL.ImageDraw.ImageDraw.text

        def spy_text(self, xy, text, *args, **kwargs):
            drawn.setdefault("texts", []).append(text)
            return real_text(self, xy, text, *args, **kwargs)

        monkeypatch.setattr(PIL.ImageDraw.ImageDraw, "text", spy_text)
        og.generate_og_image(post, str(tmp_path / "og"))

        title_text = drawn["texts"][0]
        lines = title_text.split("\n")
        assert len(lines) == 3  # يُقتصر على ثلاثة أسطر | capped at three lines
        assert all(len(line) <= 30 for line in lines)

    def test_short_title_is_single_line(self, write_post, tmp_path, monkeypatch):
        post = write_post("2026-03-10-short.md", '---\ntitle: "Short title"\n---\n\nb\n')
        texts = []
        import PIL.ImageDraw

        real_text = PIL.ImageDraw.ImageDraw.text

        def spy_text(self, xy, text, *args, **kwargs):
            texts.append(text)
            return real_text(self, xy, text, *args, **kwargs)

        monkeypatch.setattr(PIL.ImageDraw.ImageDraw, "text", spy_text)
        og.generate_og_image(post, str(tmp_path / "og"))

        assert texts[0] == "Short title"
        assert texts[1] == "selghribi.dev | artsmoroccan.me"

    def test_default_title_when_missing(self, write_post, tmp_path):
        post = write_post("2026-03-10-untitled.md", "---\nlayout: post\n---\n\nbody\n")
        assert og.generate_og_image(post, str(tmp_path / "og")).endswith("untitled.png")

    def test_falls_back_to_default_font(self, write_post, tmp_path, sample_post_body, monkeypatch):
        post = write_post("2026-03-10-hello-morocco.md", sample_post_body)
        monkeypatch.setattr(og.os.path, "exists", lambda path: False)
        assert og.generate_og_image(post, str(tmp_path / "og")) is not None

    def test_survives_font_loading_error(self, write_post, tmp_path, sample_post_body, monkeypatch):
        post = write_post("2026-03-10-hello-morocco.md", sample_post_body)
        import PIL.ImageFont

        real_truetype = PIL.ImageFont.truetype

        def boom(font=None, *args, **kwargs):
            if isinstance(font, str):
                raise OSError("cannot open font")
            return real_truetype(font, *args, **kwargs)

        monkeypatch.setattr(PIL.ImageFont, "truetype", boom)
        monkeypatch.setattr(og.os.path, "exists", lambda path: True)
        assert og.generate_og_image(post, str(tmp_path / "og")) is not None

    def test_returns_none_without_pillow(self, write_post, tmp_path, sample_post_body, monkeypatch, capsys):
        post = write_post("2026-03-10-hello-morocco.md", sample_post_body)
        real_import = builtins.__import__

        def fake_import(name, *args, **kwargs):
            if name == "PIL" or name.startswith("PIL."):
                raise ImportError("no PIL")
            return real_import(name, *args, **kwargs)

        monkeypatch.setattr(builtins, "__import__", fake_import)
        assert og.generate_og_image(post, str(tmp_path / "og")) is None
        assert "Pillow not installed" in capsys.readouterr().out


class TestGenerateAllOgImages:
    def test_counts_generated_images(self, write_post, tmp_path, sample_post_body):
        first = write_post("2026-03-10-first.md", sample_post_body)
        write_post("2026-03-11-second.md", sample_post_body)
        posts_dir = os.path.dirname(first)
        out_dir = tmp_path / "og"

        assert og.generate_all_og_images(posts_dir, str(out_dir)) == 2
        assert {p.name for p in out_dir.glob("*.png")} == {"first.png", "second.png"}

    def test_ignores_failed_generations(self, write_post, tmp_path, sample_post_body, monkeypatch):
        first = write_post("2026-03-10-first.md", sample_post_body)
        write_post("2026-03-11-second.md", sample_post_body)
        monkeypatch.setattr(
            og, "generate_og_image", lambda path, out: None if "second" in path else "ok.png"
        )
        assert og.generate_all_og_images(os.path.dirname(first), str(tmp_path)) == 1

    def test_empty_directory(self, tmp_path):
        assert og.generate_all_og_images(str(tmp_path), str(tmp_path / "og")) == 0


class TestMain:
    def _argv(self, monkeypatch, *args):
        monkeypatch.setattr("sys.argv", ["generate_og_image.py", *args])

    def test_single_post(self, write_post, tmp_path, sample_post_body, monkeypatch):
        post = write_post("2026-03-10-hello-morocco.md", sample_post_body)
        out_dir = tmp_path / "og"
        self._argv(monkeypatch, "--post", post, "--output", str(out_dir))
        og.main()
        assert (out_dir / "hello-morocco.png").is_file()

    def test_all_posts(self, write_post, tmp_path, sample_post_body, monkeypatch, capsys):
        write_post("2026-03-10-first.md", sample_post_body)
        out_dir = tmp_path / "og"
        monkeypatch.chdir(tmp_path)
        self._argv(monkeypatch, "--all", "--output", str(out_dir))
        og.main()
        assert "Generated 1 images" in capsys.readouterr().out

    def test_missing_post_exits(self, tmp_path, monkeypatch, capsys):
        self._argv(monkeypatch, "--post", str(tmp_path / "nope.md"))
        with pytest.raises(SystemExit) as exc:
            og.main()
        assert exc.value.code == 1
        assert "File not found" in capsys.readouterr().out

    def test_no_arguments_prints_help_and_exits(self, monkeypatch, capsys):
        self._argv(monkeypatch)
        with pytest.raises(SystemExit) as exc:
            og.main()
        assert exc.value.code == 1
        assert "usage" in capsys.readouterr().out
