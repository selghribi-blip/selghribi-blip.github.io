#!/usr/bin/env python3
"""
generate_og_image.py
====================
إنشاء صور Open Graph تلقائياً | Auto-generate Open Graph images
استخدام | Usage:
    python scripts/generate_og_image.py --post _posts/2026-03-10-welcome.md
    python scripts/generate_og_image.py --all
"""

import argparse
import os
import sys
from pathlib import Path

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

# إعدادات الصورة | Image settings
OG_WIDTH = 1200
OG_HEIGHT = 630
OUTPUT_DIR = "assets/images/og"


def parse_front_matter(filepath: str) -> dict:
    """تحليل front matter من ملف Markdown | Parse front matter from Markdown file"""
    meta = {}
    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    if not content.startswith("---"):
        return meta

    parts = content.split("---", 2)
    if len(parts) < 3:
        return meta

    import re
    for line in parts[1].strip().split("\n"):
        match = re.match(r'^(\w+):\s*["\']?(.+?)["\']?\s*$', line)
        if match:
            meta[match.group(1)] = match.group(2)

    return meta


def get_slug_from_filename(filepath: str) -> str:
    """استخراج slug من اسم الملف | Extract slug from filename"""
    name = Path(filepath).stem
    # إزالة التاريخ من بداية اسم الملف | Remove date prefix
    parts = name.split("-", 3)
    if len(parts) >= 4:
        return parts[3]
    return name


def generate_og_image(post_path: str, output_dir: str = OUTPUT_DIR) -> str | None:
    """
    إنشاء صورة OG لمقالة | Generate OG image for a post
    يتطلب مكتبة Pillow | Requires Pillow library
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("❌ مكتبة Pillow غير مثبتة | Pillow not installed")
        print("   pip install Pillow")
        return None

    meta = parse_front_matter(post_path)
    title = meta.get("title", "مقالة جديدة").strip('"\'')
    slug = get_slug_from_filename(post_path)

    # إنشاء مجلد الإخراج | Create output directory
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{slug}.png")

    # إنشاء الصورة | Create image
    img = Image.new("RGB", (OG_WIDTH, OG_HEIGHT), COLORS["deep_blue"])
    draw = ImageDraw.Draw(img)

    # خلفية gradient بسيطة | Simple gradient background
    for y in range(OG_HEIGHT):
        ratio = y / OG_HEIGHT
        r = int(COLORS["deep_blue"][0] + (COLORS["emerald"][0] - COLORS["deep_blue"][0]) * ratio * 0.4)
        g = int(COLORS["deep_blue"][1] + (COLORS["emerald"][1] - COLORS["deep_blue"][1]) * ratio * 0.4)
        b = int(COLORS["deep_blue"][2] + (COLORS["emerald"][2] - COLORS["deep_blue"][2]) * ratio * 0.4)
        draw.line([(0, y), (OG_WIDTH, y)], fill=(r, g, b))

    # شريط ذهبي سفلي | Gold bottom stripe
    stripe_height = 8
    draw.rectangle([(0, OG_HEIGHT - stripe_height), (OG_WIDTH, OG_HEIGHT)],
                   fill=COLORS["gold"])

    # محاولة تحميل خط | Try to load font
    font_title = None
    font_site = None
    try:
        # البحث عن خط متاح | Find available font
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "C:/Windows/Fonts/arial.ttf",
        ]
        for fp in font_paths:
            if os.path.exists(fp):
                font_title = ImageFont.truetype(fp, size=64)
                font_site = ImageFont.truetype(fp, size=32)
                break
    except Exception:
        pass

    if font_title is None:
        font_title = ImageFont.load_default()
        font_site = ImageFont.load_default()

    # كتابة العنوان | Write title
    padding = 80
    title_y = OG_HEIGHT // 2 - 80
    # تقطيع العنوان الطويل | Wrap long title
    max_chars = 30
    if len(title) > max_chars:
        words = title.split()
        lines = []
        current = ""
        for word in words:
            if len(current) + len(word) + 1 <= max_chars:
                current += (" " if current else "") + word
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        title_text = "\n".join(lines[:3])
    else:
        title_text = title

    draw.text((padding, title_y), title_text, font=font_title, fill=COLORS["cream"])

    # كتابة اسم الموقع | Write site name
    site_name = "selghribi.dev | artsmoroccan.me"
    draw.text((padding, OG_HEIGHT - 80), site_name, font=font_site, fill=COLORS["gold"])

    # حفظ الصورة | Save image
    img.save(output_path, "PNG", optimize=True)
    print(f"✅ تم إنشاء: {output_path}")
    return output_path


def generate_all_og_images(posts_dir: str = "_posts", output_dir: str = OUTPUT_DIR) -> int:
    """إنشاء صور OG لجميع المقالات | Generate OG images for all posts"""
    posts = list(Path(posts_dir).glob("*.md"))
    count = 0
    for post in posts:
        result = generate_og_image(str(post), output_dir)
        if result:
            count += 1
    return count


def main():
    parser = argparse.ArgumentParser(
        description="إنشاء صور Open Graph | Generate Open Graph images"
    )
    parser.add_argument("--post", help="مسار ملف المقالة | Path to post file")
    parser.add_argument("--all", action="store_true", help="إنشاء لجميع المقالات | Generate for all posts")
    parser.add_argument("--output", default=OUTPUT_DIR, help="مجلد الإخراج | Output directory")
    args = parser.parse_args()

    if args.all:
        count = generate_all_og_images(output_dir=args.output)
        print(f"✅ تم إنشاء {count} صورة | Generated {count} images")
    elif args.post:
        if not os.path.exists(args.post):
            print(f"❌ الملف غير موجود | File not found: {args.post}")
            sys.exit(1)
        generate_og_image(args.post, args.output)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
