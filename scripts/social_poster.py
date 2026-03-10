#!/usr/bin/env python3
"""
social_poster.py
================
نشر تلقائي على السوشال ميديا | Auto-post to social media
استخدام | Usage:
    python scripts/social_poster.py --post _posts/2026-03-10-welcome.md --platform twitter
    python scripts/social_poster.py --post _posts/2026-03-10-welcome.md --platform all
متغيرات البيئة المطلوبة | Required environment variables:
    TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
    LINKEDIN_ACCESS_TOKEN, LINKEDIN_USER_ID
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path


def parse_front_matter(filepath: str) -> dict:
    """تحليل front matter من ملف Markdown | Parse front matter from Markdown file"""
    meta = {}
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
        match = re.match(r'^(\w+):\s*["\']?(.+?)["\']?\s*$', line)
        if match:
            meta[match.group(1)] = match.group(2)

    # تحليل tags و categories | Parse tags and categories
    for array_key in ("tags", "categories"):
        array_match = re.search(
            rf'^{array_key}:\s*\[([^\]]+)\]',
            parts[1],
            re.MULTILINE
        )
        if array_match:
            items = [t.strip().strip('"\'') for t in array_match.group(1).split(",")]
            meta[array_key] = items

    return meta


def build_post_url(meta: dict, base_url: str = "https://artsmoroccan.me") -> str:
    """بناء رابط المقالة | Build post URL"""
    date_str = meta.get("date", datetime.now().strftime("%Y-%m-%d"))
    try:
        date_parts = str(date_str).split("-")
        year, month, day = date_parts[0], date_parts[1], date_parts[2][:2]
    except (IndexError, ValueError):
        year = month = day = datetime.now().strftime("%Y %m %d").split()
        year, month, day = str(year[0]), str(month[0]), str(day[0])

    # استخراج slug من عنوان | Extract slug from title
    title = meta.get("title", "post").lower()
    title = re.sub(r'[^\w\s-]', '', title, flags=re.UNICODE)
    title = re.sub(r'[\s_-]+', '-', title)
    title = title.strip('-')[:50]

    return f"{base_url}/blog/{year}/{month}/{day}/{title}/"


def build_twitter_text(meta: dict, url: str) -> str:
    """بناء نص تغريدة | Build tweet text"""
    title = meta.get("title", "مقالة جديدة").strip('"\'')
    description = meta.get("description", "").strip('"\'')
    tags = meta.get("tags", [])

    # بناء النص | Build text
    text_parts = [f"📝 {title}"]
    if description:
        text_parts.append(f"\n{description[:100]}...")
    text_parts.append(f"\n🔗 {url}")

    # إضافة hashtags | Add hashtags
    if tags:
        hashtags = " ".join(f"#{tag}" for tag in tags[:4])
        text_parts.append(f"\n{hashtags}")

    text_parts.append("\n🇲🇦 #Arabic #WebDev #Morocco")

    tweet = "\n".join(text_parts)
    # تويتر يقبل حتى 280 حرف | Twitter allows up to 280 chars
    return tweet[:280]


def build_linkedin_text(meta: dict, url: str) -> str:
    """بناء منشور LinkedIn | Build LinkedIn post"""
    title = meta.get("title", "مقالة جديدة").strip('"\'')
    description = meta.get("description", "").strip('"\'')
    tags = meta.get("tags", [])

    text = f"📝 مقالة جديدة | New Article\n\n"
    text += f"**{title}**\n\n"
    if description:
        text += f"{description}\n\n"
    text += f"🔗 اقرأ المقالة كاملة: {url}\n\n"

    if tags:
        hashtags = " ".join(f"#{tag}" for tag in tags[:6])
        text += f"{hashtags}\n"

    text += "#Arabic #Morocco #WebDevelopment #GitHub #OpenSource"
    return text


def post_to_twitter(text: str) -> bool:
    """نشر على Twitter/X | Post to Twitter/X"""
    api_key = os.environ.get("TWITTER_API_KEY")
    api_secret = os.environ.get("TWITTER_API_SECRET")
    access_token = os.environ.get("TWITTER_ACCESS_TOKEN")
    access_secret = os.environ.get("TWITTER_ACCESS_SECRET")

    if not all([api_key, api_secret, access_token, access_secret]):
        print("⚠️  متغيرات Twitter غير محددة | Twitter env vars not set")
        print("   TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET")
        return False

    try:
        import tweepy  # type: ignore
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret,
        )
        response = client.create_tweet(text=text)
        tweet_id = response.data.get("id", "unknown") if response.data else "unknown"
        print(f"✅ Twitter: https://twitter.com/i/web/status/{tweet_id}")
        return True
    except ImportError:
        print("❌ tweepy غير مثبت | tweepy not installed: pip install tweepy")
        return False
    except Exception as e:
        print(f"❌ خطأ في Twitter | Twitter error: {e}")
        return False


def post_to_linkedin(text: str, url: str) -> bool:
    """نشر على LinkedIn"""
    access_token = os.environ.get("LINKEDIN_ACCESS_TOKEN")
    user_id = os.environ.get("LINKEDIN_USER_ID")

    if not all([access_token, user_id]):
        print("⚠️  متغيرات LinkedIn غير محددة | LinkedIn env vars not set")
        print("   LINKEDIN_ACCESS_TOKEN, LINKEDIN_USER_ID")
        return False

    try:
        import urllib.request

        payload = json.dumps({
            "author": f"urn:li:person:{user_id}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": text},
                    "shareMediaCategory": "ARTICLE",
                    "media": [{
                        "status": "READY",
                        "originalUrl": url,
                    }],
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            },
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.linkedin.com/v2/ugcPosts",
            data=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            print(f"✅ LinkedIn: منشور بنجاح | Posted successfully (status: {response.status})")
            return True
    except Exception as e:
        print(f"❌ خطأ في LinkedIn | LinkedIn error: {e}")
        return False


def log_posting(post_path: str, platforms: list[str], success: dict) -> None:
    """تسجيل عمليات النشر | Log posting operations"""
    log_dir = ".github/logs"
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "social_posts.json")

    # قراءة السجل الموجود | Read existing log
    logs = []
    if os.path.exists(log_file):
        try:
            with open(log_file, encoding="utf-8") as f:
                logs = json.load(f)
        except (json.JSONDecodeError, OSError):
            logs = []

    # إضافة سجل جديد | Add new log entry
    entry = {
        "timestamp": datetime.now().isoformat(),
        "post": post_path,
        "platforms": platforms,
        "success": success,
    }
    logs.append(entry)

    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(logs, f, ensure_ascii=False, indent=2)

    print(f"📝 تم تسجيل عملية النشر في: {log_file}")


def main():
    parser = argparse.ArgumentParser(
        description="نشر المقالات على السوشال ميديا | Post articles to social media"
    )
    parser.add_argument("--post", required=True, help="مسار ملف المقالة | Path to post file")
    parser.add_argument(
        "--platform",
        default="all",
        choices=["twitter", "linkedin", "all"],
        help="المنصة المستهدفة | Target platform",
    )
    parser.add_argument(
        "--base-url",
        default="https://artsmoroccan.me",
        help="رابط الموقع الأساسي | Base site URL",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="عرض النص بدون نشر | Show text without posting",
    )
    args = parser.parse_args()

    if not os.path.exists(args.post):
        print(f"❌ الملف غير موجود | File not found: {args.post}")
        sys.exit(1)

    meta = parse_front_matter(args.post)
    url = build_post_url(meta, args.base_url)

    print(f"📄 المقالة | Post: {args.post}")
    print(f"🔗 الرابط | URL: {url}")
    print()

    platforms = ["twitter", "linkedin"] if args.platform == "all" else [args.platform]
    success = {}

    for platform in platforms:
        if platform == "twitter":
            text = build_twitter_text(meta, url)
            print(f"--- Twitter ---\n{text}\n")
            if not args.dry_run:
                success["twitter"] = post_to_twitter(text)

        elif platform == "linkedin":
            text = build_linkedin_text(meta, url)
            print(f"--- LinkedIn ---\n{text[:200]}...\n")
            if not args.dry_run:
                success["linkedin"] = post_to_linkedin(text, url)

    if not args.dry_run and success:
        log_posting(args.post, platforms, success)


if __name__ == "__main__":
    main()
