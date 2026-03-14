# 🏭 مصنع المحتوى المغربي | Moroccan Content Factory

<div align="center">

![Arts Moroccan](https://img.shields.io/badge/Arts%20Moroccan-artsmoroccan.me-c0674a?style=for-the-badge)
![Jekyll](https://img.shields.io/badge/Jekyll-4.3-red?style=for-the-badge&logo=jekyll)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen?style=for-the-badge&logo=github)
![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**مدونة تقنية عربية + بورتفوليو احترافي + أتمتة كاملة = مصنع محتوى مجاني 🚀**

[🌐 زيارة الموقع](https://artsmoroccan.me) · [📝 أحدث المقالات](https://artsmoroccan.me/blog) · [💼 معرض الأعمال](https://artsmoroccan.me/portfolio)

</div>

---

## 📋 جدول المحتويات

- [نظرة عامة](#نظرة-عامة)
- [هيكل المشروع](#هيكل-المشروع)
- [PDF & Contract Summarizer](#-pdf--contract-summarizer)
- [التشغيل المحلي](#التشغيل-المحلي)
- [أدوات الأتمتة](#أدوات-الأتمتة)
- [كيفية إضافة مقالة جديدة](#كيفية-إضافة-مقالة-جديدة)
- [المساهمة](#المساهمة)
- [الدعم المالي](#الدعم-المالي)

---

## 🎯 نظرة عامة

هذا المشروع هو **مصنع محتوى متكامل** بُني على أدوات GitHub المجانية المتاحة لطلاب Computer Science عبر **GitHub Student Developer Pack**. يجمع بين:

| المكوّن | الوصف |
|---------|-------|
| 🌐 **موقع Jekyll** | مدونة + بورتفوليو احترافي |
| 🤖 **GitHub Actions** | أتمتة النشر والسوشال ميديا والنشرة البريدية |
| 🐍 **Python Scripts** | أدوات لإنشاء المحتوى وصور OG وإدارة النشرة |
| 📱 **RTL Support** | دعم كامل للغة العربية |
| 💰 **قنوات الدخل** | GitHub Sponsors + Ko-fi + Gumroad |

---

## 📂 هيكل المشروع

```
selghribi-blip.github.io/
├── CNAME                          (artsmoroccan.me)
├── _config.yml                    (إعدادات Jekyll)
├── Gemfile                        (Ruby dependencies)
├── index.html                     (الصفحة الرئيسية)
├── _layouts/                      (قوالب الصفحات)
│   ├── default.html
│   ├── post.html
│   └── page.html
├── _includes/                     (مكونات مشتركة)
│   ├── head.html
│   ├── header.html
│   ├── footer.html
│   └── newsletter-form.html
├── _posts/                        (المقالات)
├── _sass/                         (أنماط CSS)
├── assets/                        (ملفات ثابتة)
├── pages/                         (صفحات ثابتة)
├── templates/                     (قوالب مجانية)
├── scripts/                       (أدوات Python)
├── app/                           (PDF & Contract Summarizer — Next.js)
│   ├── src/app/                   (App Router pages & API routes)
│   ├── src/lib/                   (auth, stripe, rate limiter helpers)
│   ├── .env.example               (environment variable template)
│   └── README.md                  (deployment guide)
└── .github/
    ├── workflows/                 (6 workflows أتمتة)
    ├── ISSUE_TEMPLATE/
    ├── PULL_REQUEST_TEMPLATE.md
    └── FUNDING.yml
```

---

## 📄 PDF & Contract Summarizer

يشمل المشروع تطبيق Next.js لتلخيص ملفات PDF والعقود بالذكاء الاصطناعي.

| الميزة | المجاني | Pro ($9/شهر) |
|--------|---------|-------------|
| تلخيص PDF | ✓ (5/يوم) | ✓ غير محدود |
| وضع العقود | ✗ | ✓ |
| تسجيل الدخول OAuth | ✓ | ✓ |

**النطاق الموصى به:** `app.artsmoroccan.me`

انشر تطبيق Next.js على [Vercel](https://vercel.com) مع النطاق الفرعي `app.artsmoroccan.me`.
يبقى موقع Jekyll على النطاق الرئيسي `artsmoroccan.me` عبر GitHub Pages.

راجع [`app/README.md`](./app/README.md) للتفاصيل الكاملة حول الإعداد والنشر.

---

## 🚀 التشغيل المحلي

### المتطلبات:
- Python 3.11+
- Bundler

```bash
# تثبيت الاعتمادات | Install dependencies
bundle install

# تشغيل الموقع محلياً | Run locally
bundle exec jekyll serve --livereload

# الموقع يعمل على | Site available at:
# http://localhost:4000
```

---

## 🤖 أدوات الأتمتة

### GitHub Actions Workflows:

| Workflow | المهمة | المشغّل |
|----------|--------|---------|
| `deploy.yml` | نشر الموقع | Push على main |
| `quality-check.yml` | فحص الجودة | فتح PR |
| `auto-social-share.yml` | نشر على السوشال | مقالة جديدة |
| `weekly-newsletter.yml` | النشرة البريدية | كل أحد 9 صباحاً |
| `auto-og-images.yml` | إنشاء صور OG | مقالة جديدة |
| `welcome-contributors.yml` | ترحيب بالمساهمين | أول PR/Issue |

### Python Scripts:

```bash
# إنشاء مقالة جديدة بسرعة | Create new post quickly
python scripts/new_post.py

# إنشاء صور Open Graph | Generate OG images
python scripts/generate_og_image.py --post _posts/2026-03-10-welcome.md

# بناء النشرة البريدية | Build newsletter
python scripts/newsletter_builder.py --since 7 --output newsletter.html

# النشر على السوشال ميديا | Post to social media
python scripts/social_poster.py --post _posts/2026-03-10-welcome.md --platform all
```

---

## ✍️ كيفية إضافة مقالة جديدة

### الطريقة السريعة (موصى بها):
```bash
python scripts/new_post.py
```

### يدوياً:
أنشئ ملفاً في `_posts/` بالتنسيق `YYYY-MM-DD-slug.md`:

```yaml
---
layout: post
title: "عنوان المقالة"
title_en: "Article Title in English"
date: 2026-03-10
categories: [tutorial, github]
tags: [tag1, tag2]
description: "وصف مختصر للمقالة"
image: /assets/images/og/slug.png
lang: ar
---

محتوى المقالة هنا...
```

---

## 🤝 المساهمة

نرحب بأي مساهمة! يرجى:

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

راجع [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) للتفاصيل.

---

## 💰 الدعم المالي

إذا أعجبك هذا المشروع، يمكنك دعمه عبر:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-pink?logo=github-sponsors)](https://github.com/sponsors/selghribi-blip)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?logo=ko-fi)](https://ko-fi.com/selghribi)
[![Gumroad](https://img.shields.io/badge/Gumroad-Products-36a9ae?logo=gumroad)](https://gumroad.com/selghribi)

---

## 📄 الرخصة

هذا المشروع مرخص تحت [MIT License](LICENSE).

---

<div align="center">

صُنع بـ ❤️ في المغرب | Made with ❤️ in Morocco 🇲🇦

</div>