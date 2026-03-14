# CSV Cleaner — Landing Page & Project Site

<div align="center">

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen?style=for-the-badge&logo=github)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**أداة مجانية لتنظيف ملفات CSV و Excel بالعربية والإنجليزية 🚀**

[🌐 زيارة الموقع](https://selghribi-blip.github.io/) · [📧 تواصل معنا](mailto:WYNM72627@GMAIL.COM) · [💻 CSV Cleaner CLI](projects/csv-cleaner/)

</div>

---

## 📋 جدول المحتويات

- [نظرة عامة](#نظرة-عامة)
- [هيكل المشروع](#هيكل-المشروع)
- [نشر GitHub Pages](#نشر-github-pages)
- [ربط دومين مخصص](#ربط-دومين-مخصص)
- [التشغيل المحلي](#التشغيل-المحلي)
- [أداة CSV Cleaner](#أداة-csv-cleaner)
- [المساهمة](#المساهمة)
- [الدعم المالي](#الدعم-المالي)

---

## 🎯 نظرة عامة

هذا المستودع يحتوي على:

| المكوّن | الوصف |
|---------|-------|
| 🌐 **index.html** | **الصفحة الرئيسية للموقع** — Landing Page لمنتج CSV Cleaner |
| 🐍 **projects/csv-cleaner/** | أداة Python لتنظيف ملفات CSV و Excel |
| 📝 **pages/** | صفحات ثابتة (عني، المدونة، التواصل، إلخ) |
| 🤖 **.github/workflows/** | أتمتة النشر والفحص |

> **ملاحظة:** الصفحة الرئيسية للموقع هي ملف `index.html` في جذر المستودع.

---

## 📂 هيكل المشروع

```
selghribi-blip.github.io/
├── index.html                     ← الصفحة الرئيسية (Landing Page)
├── CNAME                          (دومين مخصص — Custom domain)
├── _config.yml                    (إعدادات Jekyll)
├── Gemfile                        (Ruby dependencies)
├── _layouts/                      (قوالب الصفحات)
├── _includes/                     (مكونات مشتركة)
├── _posts/                        (المقالات)
├── _sass/                         (أنماط CSS)
├── assets/
│   ├── images/favicon.svg         (Favicon placeholder)
│   ├── css/
│   └── js/
├── pages/                         (صفحات ثابتة)
├── projects/
│   └── csv-cleaner/               (أداة Python)
├── scripts/                       (سكريبتات الأتمتة)
└── .github/
    └── workflows/                 (GitHub Actions)
```

---

## 🚀 نشر GitHub Pages

### الخطوة 1 — Fork أو Clone المستودع

```bash
git clone https://github.com/selghribi-blip/selghribi-blip.github.io.git
cd selghribi-blip.github.io
```

### الخطوة 2 — تفعيل GitHub Pages

1. اذهب إلى **Settings** في المستودع.
2. اختر **Pages** من القائمة الجانبية.
3. تحت **Source**، اختر **Deploy from a branch**.
4. اختر `main` branch و `/ (root)`.
5. اضغط **Save**.

بعد دقيقة أو أكثر سيكون الموقع متاحاً على:
`https://<username>.github.io/`

### الخطوة 3 — تحقق من النشر

اذهب إلى **Actions** في المستودع وتأكد أن workflow "pages build and deployment" اكتمل بنجاح (✅).

---

## 🌐 ربط دومين مخصص

### إذا كان لديك دومين من GitHub Student Pack أو أي مزود:

#### 1. أضف ملف CNAME في جذر المستودع:
```
yourdomain.com
```

#### 2. أضف DNS records عند مزود الدومين:
| النوع | الاسم | القيمة |
|-------|-------|---------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `<username>.github.io` |

#### 3. فعّل HTTPS في Settings → Pages:
- تأكد أن "Enforce HTTPS" مفعّل.

#### 4. حدّث `_config.yml`:
```yaml
url: "https://yourdomain.com"
```

---

## 🖥️ التشغيل المحلي

### المتطلبات:
- Ruby 3.0+
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

## 🐍 أداة CSV Cleaner

### التثبيت:

```bash
cd projects/csv-cleaner
pip install -r requirements.txt
```

### الاستخدام:

```bash
# تنظيف ملف CSV
python cli.py -i input.csv -o cleaned.csv

# تنظيف ملف Excel (أول ورقة تلقائياً)
python cli.py -i input.xlsx -o cleaned.csv

# تحديد ورقة معينة
python cli.py -i input.xlsx -o cleaned.csv --sheet "Sheet1"

# استخدام فاصل مخصص
python cli.py -i input.csv -o cleaned.csv --sep ";"
```

### المزايا:
- حذف الصفوف المكررة
- تقليم المسافات الزائدة
- إصلاح الترميز (UTF-8, cp1256, latin1)
- دعم العربية والإنجليزية
- إخراج UTF-8-SIG (متوافق مع Excel)
- تقرير JSON + TXT تفصيلي

---

## 🤝 المساهمة

نرحب بأي مساهمة!

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

---

## 💰 الدعم المالي

إذا أعجبك هذا المشروع، يمكنك دعمه عبر:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-pink?logo=github-sponsors)](https://github.com/sponsors/selghribi-blip)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?logo=ko-fi)](https://ko-fi.com/selghribi)
[![Gumroad](https://img.shields.io/badge/Gumroad-Products-36a9ae?logo=gumroad)](https://gumroad.com/selghribi)

---

## 📧 التواصل

للاستفسارات والتعاون: **[WYNM72627@GMAIL.COM](mailto:WYNM72627@GMAIL.COM)**

---

## 📄 الرخصة

هذا المشروع مرخص تحت [MIT License](LICENSE).

---

<div align="center">

صُنع بـ ❤️ في المغرب | Made with ❤️ in Morocco 🇲🇦

</div>
