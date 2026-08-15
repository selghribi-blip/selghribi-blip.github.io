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
from datetime import datetime

from content_lib import (
    BASE_URL,
    build_post_url,
    clean,
    die,
    hashtags,
    parse_front_matter,
    require_env,
)


def build_twitter_text(meta: dict, url: str) -> str:
    """بناء نص تغريدة | Build tweet text"""
    title = clean(meta.get("title"), "مقالة جديدة")
    description = clean(meta.get("description"))
    tags = hashtags(meta, 4)

    # بناء النص | Build text
    text_parts = [f"📝 {title}"]
    if description:
        text_parts.append(f"\n{description[:100]}...")
    text_parts.append(f"\n🔗 {url}")

    # إضافة hashtags | Add hashtags
    if tags:
        text_parts.append(f"\n{tags}")

    text_parts.append("\n🇲🇦 #Arabic #WebDev #Morocco")

    tweet = "\n".join(text_parts)
    # تويتر يقبل حتى 280 حرف | Twitter allows up to 280 chars
    return tweet[:280]


def build_linkedin_text(meta: dict, url: str) -> str:
    """بناء منشور LinkedIn | Build LinkedIn post"""
    title = clean(meta.get("title"), "مقالة جديدة")
    description = clean(meta.get("description"))
    tags = hashtags(meta, 6)

    text = f"📝 مقالة جديدة | New Article\n\n"
    text += f"**{title}**\n\n"
    if description:
        text += f"{description}\n\n"
    text += f"🔗 اقرأ المقالة كاملة: {url}\n\n"

    if tags:
        text += f"{tags}\n"

    text += "#Arabic #Morocco #WebDevelopment #GitHub #OpenSource"
    return text


def post_to_twitter(text: str) -> bool:
    """نشر على Twitter/X | Post to Twitter/X"""
    env = require_env(
        [
            "TWITTER_API_KEY",
            "TWITTER_API_SECRET",
            "TWITTER_ACCESS_TOKEN",
            "TWITTER_ACCESS_SECRET",
        ],
        "Twitter",
    )
    if env is None:
        return False

    try:
        import tweepy  # type: ignore
        client = tweepy.Client(
            consumer_key=env["TWITTER_API_KEY"],
            consumer_secret=env["TWITTER_API_SECRET"],
            access_token=env["TWITTER_ACCESS_TOKEN"],
            access_token_secret=env["TWITTER_ACCESS_SECRET"],
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
    env = require_env(["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_USER_ID"], "LinkedIn")
    if env is None:
        return False

    try:
        import urllib.request

        payload = json.dumps({
            "author": f"urn:li:person:{env['LINKEDIN_USER_ID']}",
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
                "Authorization": f"Bearer {env['LINKEDIN_ACCESS_TOKEN']}",
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
        default=BASE_URL,
        help="رابط الموقع الأساسي | Base site URL",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="عرض النص بدون نشر | Show text without posting",
    )
    args = parser.parse_args()

    if not os.path.exists(args.post):
        die(f"الملف غير موجود | File not found: {args.post}")

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
