#!/usr/bin/env python3
"""
new_post.py
===========
سكريبت CLI لإنشاء مقالة جديدة بسرعة | CLI script to quickly create a new post
استخدام | Usage:
    python scripts/new_post.py
    python scripts/new_post.py --title "عنوان المقالة" --lang ar --category tutorial
"""

import argparse
import os
import re
import sys
from datetime import datetime
from pathlib import Path


def slugify(text: str) -> str:
    """
    تحويل النص إلى slug صالح لأسماء الملفات
    Convert text to a valid filename slug
    """
    # إزالة الأحرف الخاصة | Remove special characters
    text = text.lower().strip()
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'[^\w-]', '', text, flags=re.UNICODE)
    text = re.sub(r'-+', '-', text)
    text = text.strip('-')
    # إذا كان النص عربياً، أضف slug بالإنجليزية | If Arabic, prompt for English slug
    return text[:60]  # حد أقصى 60 حرف | Max 60 chars


def get_available_categories() -> list[str]:
    """الحصول على التصنيفات المتاحة | Get available categories"""
    return [
        "tutorial",
        "github",
        "automation",
        "javascript",
        "python",
        "design",
        "career",
        "tools",
        "project",
        "opinion",
    ]


def get_available_languages() -> list[str]:
    """اللغات المتاحة | Available languages"""
    return ["ar", "en", "fr"]


def create_post_file(
    title: str,
    title_en: str,
    slug: str,
    lang: str,
    categories: list[str],
    tags: list[str],
    description: str,
    posts_dir: str = "_posts",
) -> str:
    """إنشاء ملف المقالة | Create post file"""
    date = datetime.now()
    date_str = date.strftime("%Y-%m-%d")
    filename = f"{date_str}-{slug}.md"
    filepath = os.path.join(posts_dir, filename)

    if os.path.exists(filepath):
        print(f"⚠️  الملف موجود مسبقاً | File already exists: {filepath}")
        overwrite = input("هل تريد الكتابة فوقه؟ (y/N) | Overwrite? (y/N): ")
        if overwrite.lower() != 'y':
            print("إلغاء | Cancelled")
            sys.exit(0)

    categories_str = "[" + ", ".join(categories) + "]"
    tags_str = "[" + ", ".join(tags) + "]"

    content = f"""---
layout: post
title: "{title}"
title_en: "{title_en}"
date: {date_str}
categories: {categories_str}
tags: {tags_str}
description: "{description}"
image: /assets/images/og/{slug}.png
lang: {lang}
read_time: 5
---

<!-- اكتب مقالتك هنا | Write your article here -->

## المقدمة | Introduction

[اكتب مقدمة جذابة تشرح ما ستتعلمه من هذه المقالة]

---

## القسم الأول | Section 1

[محتوى القسم الأول]

```javascript
// مثال كود | Code example
console.log("Hello from selghribi!");
```

---

## القسم الثاني | Section 2

[محتوى القسم الثاني]

---

## الخلاصة | Conclusion

[لخص ما تعلمناه وادع القارئ للتعليق أو المشاركة]

---

*🇲🇦 صُنع بـ ❤️ في المغرب | Made with ❤️ in Morocco*
"""

    os.makedirs(posts_dir, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return filepath


def interactive_mode() -> dict:
    """وضع التفاعلي لإدخال معلومات المقالة | Interactive mode for post info"""
    print("\n🏭 مصنع المحتوى — إنشاء مقالة جديدة | Content Factory — Create New Post")
    print("=" * 60)

    # العنوان | Title
    title = input("\n📝 عنوان المقالة بالعربية | Arabic title: ").strip()
    if not title:
        print("❌ العنوان مطلوب | Title is required")
        sys.exit(1)

    title_en = input("📝 عنوان المقالة بالإنجليزية | English title: ").strip()
    if not title_en:
        title_en = title  # استخدام العنوان العربي إذا لم يُدخل الإنجليزي

    # الـ Slug
    default_slug = slugify(title_en or title)
    slug_input = input(f"🔗 slug (الافتراضي: {default_slug}): ").strip()
    slug = slugify(slug_input) if slug_input else default_slug
    if not slug:
        slug = "new-post-" + datetime.now().strftime("%Y%m%d%H%M%S")

    # اللغة | Language
    langs = get_available_languages()
    print(f"\n🌐 اللغة | Language: {', '.join(f'{i+1}.{l}' for i, l in enumerate(langs))}")
    lang_input = input("اختر رقم اللغة (الافتراضي: 1 = ar): ").strip()
    try:
        lang_idx = int(lang_input) - 1
        lang = langs[lang_idx] if 0 <= lang_idx < len(langs) else "ar"
    except (ValueError, IndexError):
        lang = "ar"

    # التصنيفات | Categories
    cats = get_available_categories()
    print(f"\n📂 التصنيفات المتاحة | Available categories:")
    for i, cat in enumerate(cats, 1):
        print(f"   {i}. {cat}")
    cats_input = input("اختر أرقام التصنيفات مفصولة بفاصلة (مثال: 1,3) | Choose numbers: ").strip()
    try:
        indices = [int(x.strip()) - 1 for x in cats_input.split(",") if x.strip()]
        categories = [cats[i] for i in indices if 0 <= i < len(cats)]
    except (ValueError, IndexError):
        categories = []
    if not categories:
        categories = ["tutorial"]

    # الوسوم | Tags
    tags_input = input("\n🏷️  الوسوم مفصولة بفاصلة | Tags (comma-separated): ").strip()
    tags = [t.strip() for t in tags_input.split(",") if t.strip()] if tags_input else []
    if not tags:
        tags = categories[:]  # استخدام التصنيفات كوسوم افتراضية

    # الوصف | Description
    description = input("\n📄 وصف مختصر | Short description: ").strip()
    if not description:
        description = title

    return {
        "title": title,
        "title_en": title_en,
        "slug": slug,
        "lang": lang,
        "categories": categories,
        "tags": tags,
        "description": description,
    }


def main():
    parser = argparse.ArgumentParser(
        description="إنشاء مقالة جديدة | Create a new blog post"
    )
    parser.add_argument("--title", help="عنوان المقالة بالعربية | Arabic title")
    parser.add_argument("--title-en", help="عنوان المقالة بالإنجليزية | English title")
    parser.add_argument("--slug", help="الـ slug للمقالة | Post slug")
    parser.add_argument("--lang", default="ar", choices=get_available_languages(), help="اللغة | Language")
    parser.add_argument("--category", help="التصنيف | Category")
    parser.add_argument("--tags", help="الوسوم مفصولة بفاصلة | Comma-separated tags")
    parser.add_argument("--description", help="وصف مختصر | Short description")
    parser.add_argument("--posts-dir", default="_posts", help="مجلد المقالات | Posts directory")
    args = parser.parse_args()

    # تحديد وضع التشغيل | Determine operation mode
    if args.title:
        # وضع command line | Command line mode
        title = args.title
        title_en = args.title_en or title
        slug = slugify(args.slug or args.title_en or args.title)
        lang = args.lang
        categories = [args.category] if args.category else ["tutorial"]
        tags = [t.strip() for t in args.tags.split(",")] if args.tags else categories[:]
        description = args.description or title
    else:
        # الوضع التفاعلي | Interactive mode
        data = interactive_mode()
        title = data["title"]
        title_en = data["title_en"]
        slug = data["slug"]
        lang = data["lang"]
        categories = data["categories"]
        tags = data["tags"]
        description = data["description"]

    # إنشاء الملف | Create file
    filepath = create_post_file(
        title=title,
        title_en=title_en,
        slug=slug,
        lang=lang,
        categories=categories,
        tags=tags,
        description=description,
        posts_dir=args.posts_dir,
    )

    print(f"\n✅ تم إنشاء المقالة | Post created: {filepath}")
    print(f"\n📋 الخطوات التالية | Next steps:")
    print(f"   1. افتح الملف وابدأ الكتابة | Open file and start writing:")
    print(f"      {filepath}")
    print(f"   2. أنشئ صورة OG | Generate OG image:")
    print(f"      python scripts/generate_og_image.py --post {filepath}")
    print(f"   3. راجع الموقع محلياً | Preview locally:")
    print(f"      bundle exec jekyll serve")
    print(f"   4. انشر | Publish:")
    print(f"      git add . && git commit -m 'Add post: {title[:40]}' && git push")


if __name__ == "__main__":
    main()
