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
- [التشغيل المحلي](#التشغيل-المحلي)
- [🧹 CSV Cleaner — Landing Page](#-csv-cleaner--landing-page)
- [🚀 نشر على GitHub Pages (خطوة بخطوة)](#-نشر-على-github-pages-خطوة-بخطوة)
- [🌐 ربط دومين مجاني من GitHub Student Pack](#-ربط-دومين-مجاني-من-github-student-pack)
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
└── .github/
    ├── workflows/                 (6 workflows أتمتة)
    ├── ISSUE_TEMPLATE/
    ├── PULL_REQUEST_TEMPLATE.md
    └── FUNDING.yml
```

---

## 🚀 التشغيل المحلي

### المتطلبات:
- Ruby 3.0+
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

## 🧹 CSV Cleaner — Landing Page

صفحة تسويقية مستقلة لأداة **Arabic/English CSV Cleaner** مبنية بـ HTML/CSS/JS خالص (بدون أطر ثقيلة).  
A standalone product landing page for the **Arabic/English CSV Cleaner** tool — pure HTML/CSS/JS.

| المعلومة | القيمة |
|----------|--------|
| 📄 الملف / File | `pages/csv-cleaner.html` |
| 🌐 الرابط / URL | `https://artsmoroccan.me/csv-cleaner/` |
| 🐍 كود الأداة / Tool code | `projects/csv-cleaner/` |

### أقسام الصفحة / Page Sections
- **Hero** — المشكلة والحل + زر CTA للتحميل
- **Features** — 6 مزايا رئيسية
- **Pricing** — Free ($0) و Pro ($9 one-time)
- **Contact** — نموذج بسيط (mailto) + روابط التواصل
- **FAQ** — 6 أسئلة شائعة مع accordion

---

## 🚀 نشر على GitHub Pages (خطوة بخطوة)

### الطريقة 1 — النشر التلقائي (المستودع الحالي)

> المستودع الحالي مُعدّ مسبقًا مع `deploy.yml` ينشر على Pages تلقائيًا عند كل push على `main`.

1. تأكد من أن اسم المستودع هو `USERNAME.github.io` (مثال: `selghribi-blip.github.io`)
2. اذهب إلى **Settings → Pages** في GitHub
3. في قسم **Source** اختر: `Deploy from a branch` → Branch: `main` → Folder: `/ (root)`
4. انقر **Save** — الموقع سيكون جاهزًا خلال دقيقة على `https://USERNAME.github.io`

### الطريقة 2 — إنشاء مستودع جديد للصفحة

```bash
# 1. أنشئ مستودع جديد بالاسم: username.github.io
git init my-landing-page
cd my-landing-page

# 2. انسخ ملف الصفحة
cp /path/to/csv-cleaner.html index.html

# 3. أضف وارفع
git add .
git commit -m "Add landing page"
git remote add origin https://github.com/USERNAME/USERNAME.github.io.git
git push -u origin main

# 4. فعّل Pages من Settings → Pages → Source: main / root
```

### الطريقة 3 — نشر صفحة فرعية (كما في هذا المستودع)

```bash
# الملف في: pages/csv-cleaner.html
# Front matter في رأس الملف يضبط الـ permalink:
# ---
# layout: none
# permalink: /csv-cleaner/
# ---

# بعد push على main سيكون الرابط:
# https://artsmoroccan.me/csv-cleaner/
```

---

## 🌐 ربط دومين مجاني من GitHub Student Pack

> GitHub Student Pack يتيح دومين `.me` مجاني لسنة عبر **Namecheap** أو دومين `.tech` عبر **get.tech**.

### خطوات ربط الدومين بـ GitHub Pages

**الخطوة 1 — احصل على الدومين المجاني**
1. اذهب إلى [education.github.com/pack](https://education.github.com/pack)
2. ابحث عن **Namecheap** أو **get.tech**
3. سجّل دومينك المجاني (مثال: `myname.me`)

**الخطوة 2 — اضبط DNS في Namecheap**

اذهب إلى **Dashboard → Manage → Advanced DNS** وأضف السجلات التالية:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| `A` | `@` | `185.199.108.153` | Auto |
| `A` | `@` | `185.199.109.153` | Auto |
| `A` | `@` | `185.199.110.153` | Auto |
| `A` | `@` | `185.199.111.153` | Auto |
| `CNAME` | `www` | `USERNAME.github.io` | Auto |

**الخطوة 3 — أضف الدومين في GitHub Pages**
1. اذهب إلى **Settings → Pages → Custom domain**
2. أدخل دومينك (مثال: `myname.me`) وانقر **Save**
3. انتظر 10–30 دقيقة حتى ينتشر DNS
4. فعّل **Enforce HTTPS** بعد ظهور الخيار

**الخطوة 4 — أضف ملف CNAME**

```bash
# في جذر المستودع أنشئ ملف CNAME (بدون امتداد):
echo "myname.me" > CNAME
git add CNAME
git commit -m "Add custom domain"
git push
```

> ✅ الموقع سيعمل الآن على `https://myname.me` بشهادة SSL مجانية.

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