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
import urllib.error
import urllib.request
from datetime import datetime


class PostingError(Exception):
    """خطأ في النشر | Raised when publishing to a platform fails"""


def parse_front_matter(filepath: str) -> dict:
    """تحليل front matter من ملف Markdown | Parse front matter from Markdown file"""
    meta = {}
    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    if not content.startswith("---"):
        raise ValueError(f"لا يوجد front matter | Missing front matter: {filepath}")

    parts = content.split("---", 2)
    if len(parts) < 3:
        raise ValueError(f"front matter غير مكتمل | Unterminated front matter: {filepath}")

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
    date_str = str(meta.get("date", datetime.now().strftime("%Y-%m-%d")))
    date_parts = date_str.split("-")
    if len(date_parts) < 3:
        raise ValueError(f"تاريخ المقالة غير صالح | Invalid post date: {date_str!r}")
    year, month, day = date_parts[0], date_parts[1], date_parts[2][:2]

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
    """
    نشر على Twitter/X | Post to Twitter/X
    يعيد False فقط عند عدم التهيئة | Returns False only when not configured,
    ويرفع PostingError عند فشل النشر | raises PostingError when publishing fails
    """
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
    except ImportError as e:
        raise PostingError("tweepy غير مثبت | tweepy not installed: pip install tweepy") from e

    try:
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret,
        )
        response = client.create_tweet(text=text)
    except Exception as e:
        raise PostingError(f"خطأ في Twitter | Twitter error: {e}") from e

    tweet_id = response.data.get("id", "unknown") if response.data else "unknown"
    print(f"✅ Twitter: https://twitter.com/i/web/status/{tweet_id}")
    return True


def post_to_linkedin(text: str, url: str) -> bool:
    """
    نشر على LinkedIn | Post to LinkedIn
    نفس اصطلاح post_to_twitter | Same contract as post_to_twitter
    """
    access_token = os.environ.get("LINKEDIN_ACCESS_TOKEN")
    user_id = os.environ.get("LINKEDIN_USER_ID")

    if not all([access_token, user_id]):
        print("⚠️  متغيرات LinkedIn غير محددة | LinkedIn env vars not set")
        print("   LINKEDIN_ACCESS_TOKEN, LINKEDIN_USER_ID")
        return False

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

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            print(f"✅ LinkedIn: منشور بنجاح | Posted successfully (status: {response.status})")
            return True
    except urllib.error.HTTPError as e:
        # جسم الرد يحمل سبب الرفض | The response body carries the rejection reason
        body = e.read().decode("utf-8", errors="replace")[:500]
        raise PostingError(
            f"خطأ في LinkedIn | LinkedIn error: HTTP {e.code} {e.reason}: {body}"
        ) from e
    except urllib.error.URLError as e:
        raise PostingError(f"خطأ في LinkedIn | LinkedIn error: {e.reason}") from e


def log_posting(post_path: str, platforms: list[str], success: dict) -> None:
    """
    تسجيل عمليات النشر | Log posting operations
    السجل ثانوي ولا يفشل العملية، لكن أي مشكلة تُطبع
    Logging is best-effort, but problems are always reported
    """
    log_dir = ".github/logs"
    log_file = os.path.join(log_dir, "social_posts.json")

    try:
        os.makedirs(log_dir, exist_ok=True)
    except OSError as e:
        print(f"⚠️  تعذر إنشاء مجلد السجل | Could not create log dir {log_dir}: {e}")
        return

    # قراءة السجل الموجود | Read existing log
    logs = []
    if os.path.exists(log_file):
        try:
            with open(log_file, encoding="utf-8") as f:
                logs = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            print(f"⚠️  سجل النشر غير قابل للقراءة، سيُعاد إنشاءه | Log unreadable, recreating: {e}")
            logs = []
    if not isinstance(logs, list):
        print("⚠️  سجل النشر ليس قائمة، سيُعاد إنشاءه | Log is not a list, recreating")
        logs = []

    # إضافة سجل جديد | Add new log entry
    entry = {
        "timestamp": datetime.now().isoformat(),
        "post": post_path,
        "platforms": platforms,
        "success": success,
    }
    logs.append(entry)

    try:
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)
    except OSError as e:
        print(f"⚠️  تعذر كتابة السجل | Could not write log {log_file}: {e}")
        return

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

    try:
        meta = parse_front_matter(args.post)
        url = build_post_url(meta, args.base_url)
    except (OSError, ValueError) as e:
        print(f"❌ تعذر قراءة المقالة | Could not read post: {e}")
        sys.exit(1)

    print(f"📄 المقالة | Post: {args.post}")
    print(f"🔗 الرابط | URL: {url}")
    print()

    platforms = ["twitter", "linkedin"] if args.platform == "all" else [args.platform]
    posters = {
        "twitter": (build_twitter_text, lambda text: post_to_twitter(text)),
        "linkedin": (build_linkedin_text, lambda text: post_to_linkedin(text, url)),
    }
    success: dict[str, bool] = {}
    errors: dict[str, str] = {}

    for platform in platforms:
        build_text, post = posters[platform]
        text = build_text(meta, url)
        preview = text if platform == "twitter" else f"{text[:200]}..."
        print(f"--- {platform} ---\n{preview}\n")
        if args.dry_run:
            continue
        try:
            success[platform] = post(text)
        except PostingError as e:
            # جمع الأخطاء لمحاولة بقية المنصات ثم الفشل في النهاية
            # Collect errors so other platforms are still attempted, then fail
            print(f"❌ {e}")
            success[platform] = False
            errors[platform] = str(e)

    if not args.dry_run and success:
        log_posting(args.post, platforms, success)

    if errors:
        failed = ", ".join(errors)
        print(f"❌ فشل النشر على | Failed to post to: {failed}")
        sys.exit(1)

    if not args.dry_run and not any(success.values()):
        print("❌ لم يتم النشر على أي منصة | No platform was configured, nothing was posted")
        sys.exit(1)


if __name__ == "__main__":
    main()
