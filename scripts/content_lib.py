#!/usr/bin/env python3
"""
content_lib.py
==============
أدوات مشتركة لسكريبتات المحتوى | Shared utilities for the content scripts

يستوردها | Imported by:
    generate_og_image.py, new_post.py, newsletter_builder.py, social_poster.py
"""

import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

# إعدادات الموقع | Site settings
BASE_URL = "https://artsmoroccan.me"
SITE_NAME = "selghribi.dev | artsmoroccan.me"
POSTS_DIR = "_posts"

# الألوان المستوحاة من Arts Moroccan | Colors inspired by Arts Moroccan
COLORS = {
    "deep_blue": (26, 58, 92),
    "terracotta": (192, 103, 74),
    "gold": (212, 168, 67),
    "emerald": (45, 106, 79),
    "cream": (253, 246, 236),
    "dark_text": (44, 44, 44),
    "white": (255, 255, 255),
}

_FRONT_MATTER_LINE = re.compile(r'^(\w+):\s*["\']?(.+?)["\']?\s*$')
_ARRAY_KEYS = ("tags", "categories")


def die(message: str, code: int = 1) -> None:
    """طباعة رسالة خطأ والخروج | Print an error message and exit"""
    print(f"❌ {message}")
    sys.exit(code)


def clean(value, default: str = "") -> str:
    """تنظيف قيمة من علامات التنصيص | Strip surrounding quotes from a value"""
    if value is None:
        return default
    return str(value).strip().strip('"\'') or default


def parse_front_matter(filepath: str, *, with_content: bool = False) -> dict:
    """
    تحليل front matter من ملف Markdown | Parse front matter from a Markdown file

    with_content=True يضيف | adds: _content و _excerpt
    """
    meta: dict = {"_filepath": str(filepath)}
    try:
        with open(filepath, encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ الملف غير موجود | File not found: {filepath}")
        return meta

    if not content.startswith("---"):
        return meta

    parts = content.split("---", 2)
    if len(parts) < 3:
        return meta

    for line in parts[1].strip().split("\n"):
        match = _FRONT_MATTER_LINE.match(line)
        if match:
            meta[match.group(1)] = match.group(2)

    # تحليل tags و categories كقوائم | Parse tags and categories as lists
    for array_key in _ARRAY_KEYS:
        array_match = re.search(rf'^{array_key}:\s*\[([^\]]*)\]', parts[1], re.MULTILINE)
        if array_match:
            meta[array_key] = [
                item.strip().strip('"\'')
                for item in array_match.group(1).split(",")
                if item.strip()
            ]

    if with_content:
        body = parts[2].strip()
        meta["_content"] = body
        meta["_excerpt"] = build_excerpt(body)

    return meta


def build_excerpt(body: str, max_chars: int = 200) -> str:
    """بناء مقتطف من محتوى المقالة | Build an excerpt from post content"""
    lines = [l for l in body.split("\n") if l.strip() and not l.startswith("#")]
    if not lines:
        return ""
    excerpt = re.sub(r'[*_`\[\]()]', '', " ".join(lines[:3]))
    return excerpt[:max_chars] + ("..." if len(excerpt) > max_chars else "")


def slugify(text: str, max_length: int = 60) -> str:
    """تحويل النص إلى slug صالح | Convert text to a valid slug"""
    text = text.lower().strip()
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'[^\w-]', '', text, flags=re.UNICODE)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')[:max_length]


def parse_post_filename(filepath: str) -> tuple[datetime | None, str]:
    """
    استخراج التاريخ و slug من اسم الملف | Extract date and slug from a post filename
    التنسيق | Format: YYYY-MM-DD-slug.md
    """
    stem = Path(filepath).stem
    parts = stem.split("-", 3)
    slug = parts[3] if len(parts) > 3 else stem
    if len(parts) < 3:
        return None, slug
    try:
        return datetime(int(parts[0]), int(parts[1]), int(parts[2])), slug
    except ValueError:
        return None, slug


def post_slug(meta: dict) -> str:
    """
    slug المقالة كما يحسبه Jekyll | Post slug the way Jekyll resolves it
    الأولوية | Precedence: front matter slug, filename, title
    """
    slug = clean(meta.get("slug"))
    if slug:
        return slug
    filepath = meta.get("_filepath")
    if filepath:
        _, slug = parse_post_filename(filepath)
        if slug:
            return slug
    return slugify(clean(meta.get("title"), "post"), max_length=50) or "post"


def post_date(meta: dict) -> datetime:
    """
    تاريخ المقالة كما يحسبه Jekyll | Post date the way Jekyll resolves it
    الأولوية | Precedence: front matter date, filename, today
    """
    date_str = clean(meta.get("date"))
    if date_str:
        try:
            return datetime.strptime(date_str[:10], "%Y-%m-%d")
        except ValueError:
            pass
    filepath = meta.get("_filepath")
    if filepath:
        date, _ = parse_post_filename(filepath)
        if date:
            return date
    return datetime.now()


def build_post_url(meta: dict, base_url: str = BASE_URL) -> str:
    """بناء رابط المقالة | Build the public post URL"""
    date = post_date(meta)
    return f"{base_url}/blog/{date.year}/{date.month:02d}/{date.day:02d}/{post_slug(meta)}/"


def load_posts(
    posts_dir: str = POSTS_DIR,
    *,
    since_days: int | None = None,
    with_content: bool = False,
) -> list[dict]:
    """
    تحميل المقالات من مجلد | Load posts from a directory
    since_days يقصر النتائج على المقالات الحديثة | limits results to recent posts
    """
    cutoff = datetime.now() - timedelta(days=since_days) if since_days is not None else None
    posts = []

    for filepath in sorted(Path(posts_dir).glob("*.md"), reverse=True):
        meta = parse_front_matter(str(filepath), with_content=with_content)
        meta["_date"] = post_date(meta)
        meta["_slug"] = post_slug(meta)
        if cutoff is not None and meta["_date"] < cutoff:
            continue
        posts.append(meta)

    return posts


def hashtags(meta: dict, limit: int) -> str:
    """بناء الوسوم للنشر | Build hashtags for social posts"""
    tags = meta.get("tags") or []
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]
    return " ".join(f"#{tag}" for tag in tags[:limit])


def as_text(value, separator: str = ", ") -> str:
    """تحويل قيمة front matter إلى نص | Render a front matter value as text"""
    if isinstance(value, (list, tuple)):
        return separator.join(str(v) for v in value)
    return clean(value)


def require_env(names: list[str], label: str) -> dict | None:
    """
    التحقق من متغيرات البيئة | Verify required environment variables
    يعيد None مع رسالة إذا كان أحدها مفقوداً | Returns None with a message if any is missing
    """
    values = {name: os.environ.get(name) for name in names}
    if not all(values.values()):
        print(f"⚠️  متغيرات {label} غير محددة | {label} env vars not set")
        print(f"   {', '.join(names)}")
        return None
    return values
