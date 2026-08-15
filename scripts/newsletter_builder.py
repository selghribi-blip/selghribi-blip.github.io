#!/usr/bin/env python3
"""
newsletter_builder.py
=====================
بناء النشرة البريدية الأسبوعية | Build weekly newsletter
استخدام | Usage:
    python scripts/newsletter_builder.py --since 7 --output newsletter.html
    python scripts/newsletter_builder.py --since 14 --output newsletter.html --send
متغيرات البيئة للإرسال | Env vars for sending:
    EMAIL_API_KEY (Mailgun / SendGrid / etc.)
    EMAIL_FROM, EMAIL_LIST_ID
"""

import argparse
import os
from datetime import datetime, timedelta

from content_lib import (
    BASE_URL,
    POSTS_DIR,
    as_text,
    build_post_url,
    clean,
    die,
    load_posts,
)


def get_recent_posts(posts_dir: str, days: int) -> list[dict]:
    """جمع المقالات الحديثة | Collect recent posts"""
    return load_posts(posts_dir, since_days=days, with_content=True)


def build_html_newsletter(posts: list[dict], base_url: str = BASE_URL) -> str:
    """بناء HTML للنشرة | Build newsletter HTML"""
    week_start = (datetime.now() - timedelta(days=7)).strftime("%d %B %Y")
    week_end = datetime.now().strftime("%d %B %Y")

    posts_html = ""
    for post in posts:
        title = clean(post.get("title"))
        description = clean(post.get("description") or post.get("_excerpt"))
        url = build_post_url(post, base_url)
        date = post.get("_date", datetime.now())
        date_str = date.strftime("%d %B %Y")
        categories = as_text(post.get("categories"))

        posts_html += f"""
    <tr>
      <td style="padding: 0 0 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e8ddd0;">
              {"<p style='font-size:12px; color:#c0674a; text-transform:uppercase; margin:0 0 8px;'>" + categories[:30] + "</p>" if categories else ""}
              <h2 style="margin:0 0 12px; font-size:20px; color:#1a3a5c; font-family:Georgia,serif;">
                <a href="{url}" style="color:#1a3a5c; text-decoration:none;">{title}</a>
              </h2>
              <p style="margin:0 0 16px; color:#5a5a5a; font-size:15px; line-height:1.7;">{description[:200]}...</p>
              <p style="margin:0; font-size:13px; color:#888;">📅 {date_str}</p>
              <br>
              <a href="{url}"
                 style="display:inline-block; background:#c0674a; color:#ffffff;
                        padding:10px 24px; border-radius:99px; text-decoration:none;
                        font-weight:bold; font-size:14px;">
                اقرأ المقالة ←
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>"""

    if not posts:
        posts_html = """
    <tr>
      <td style="text-align:center; padding:40px; color:#888;">
        <p>لا توجد مقالات جديدة هذا الأسبوع</p>
        <p>No new articles this week</p>
      </td>
    </tr>"""

    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>النشرة الأسبوعية | selghribi</title>
</head>
<body style="margin:0; padding:0; background:#f5f5f0; font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f0;">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a3a5c,#2d6a4f); border-radius:16px 16px 0 0; padding:40px; text-align:center;">
            <h1 style="color:#d4a843; font-family:Georgia,serif; margin:0 0 8px; font-size:28px;">
              🏺 selghribi.dev
            </h1>
            <p style="color:rgba(255,255,255,0.8); margin:0; font-size:14px;">
              النشرة الأسبوعية | {week_start} — {week_end}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fdf6ec; padding:32px;">
            <p style="font-size:17px; color:#2c2c2c; margin:0 0 32px; line-height:1.8;">
              مرحباً! 👋 هذه آخر المقالات التقنية من مدونتي هذا الأسبوع:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              {posts_html}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1a3a5c; border-radius:0 0 16px 16px; padding:24px; text-align:center;">
            <p style="color:rgba(255,255,255,0.6); font-size:12px; margin:0 0 8px;">
              © {datetime.now().year} selghribi | صُنع بـ ❤️ في المغرب 🇲🇦
            </p>
            <p style="margin:0;">
              <a href="{base_url}" style="color:#d4a843; font-size:12px; margin:0 8px;">الموقع</a>
              <a href="{base_url}/blog" style="color:#d4a843; font-size:12px; margin:0 8px;">المدونة</a>
              <a href="{{{{ unsubscribe }}}}" style="color:rgba(255,255,255,0.4); font-size:11px; margin:0 8px;">إلغاء الاشتراك</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(
        description="بناء النشرة البريدية | Build email newsletter"
    )
    parser.add_argument(
        "--since",
        type=int,
        default=7,
        help="عدد الأيام الماضية | Number of past days (default: 7)"
    )
    parser.add_argument(
        "--output",
        default="newsletter.html",
        help="ملف الإخراج | Output file (default: newsletter.html)"
    )
    parser.add_argument(
        "--posts-dir",
        default=POSTS_DIR,
        help="مجلد المقالات | Posts directory (default: _posts)"
    )
    parser.add_argument(
        "--base-url",
        default=BASE_URL,
        help="رابط الموقع الأساسي | Base URL"
    )
    parser.add_argument(
        "--send",
        action="store_true",
        help="إرسال النشرة فعلياً | Actually send the newsletter"
    )
    args = parser.parse_args()

    print(f"🔍 البحث عن مقالات خلال {args.since} يوم | Looking for posts in last {args.since} days...")

    if not os.path.isdir(args.posts_dir):
        die(f"مجلد المقالات غير موجود | Posts dir not found: {args.posts_dir}")

    posts = get_recent_posts(args.posts_dir, args.since)
    print(f"📝 وجدت {len(posts)} مقالة | Found {len(posts)} posts")

    html = build_html_newsletter(posts, args.base_url)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"✅ تم إنشاء النشرة: {args.output}")

    if args.send:
        print("📧 إرسال النشرة... | Sending newsletter...")
        # يمكن إضافة منطق الإرسال هنا (Mailgun, SendGrid, إلخ)
        # Sending logic can be added here (Mailgun, SendGrid, etc.)
        print("⚠️  وظيفة الإرسال تحتاج إعداد API key | Send function needs API key setup")


if __name__ == "__main__":
    main()
