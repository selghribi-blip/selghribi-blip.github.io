---
layout: page
title: "🧹 CSV/Excel Data Cleaner | منظف البيانات"
description: "أداة مجانية لتنظيف ملفات CSV وExcel — إزالة التكرارات، الصفوف الفارغة، إصلاح التواريخ والأرقام. مبنية بـ Python + Streamlit."
lang: ar
permalink: /pages/csv-cleaner/
---

<div style="text-align:center; padding:40px 0 20px;">
  <div style="font-size:4rem; margin-bottom:16px;">🧹</div>
  <h1 style="color:#1a3a5c; font-size:2rem; margin-bottom:8px;">CSV / Excel Data Cleaner</h1>
  <p style="color:#5a5a5a; font-size:1.1rem; max-width:600px; margin:0 auto;">
    نظّف ملفات بياناتك في ثوانٍ — مجانًا، على جهازك مباشرة، بدون إنترنت.<br>
    <em>Clean your data files in seconds — free, runs locally, no internet needed.</em>
  </p>
</div>

<div style="text-align:center; margin:24px 0 40px;">
  <a href="https://github.com/selghribi-blip/selghribi-blip.github.io/tree/main/projects/csv-cleaner"
     target="_blank" rel="noopener"
     class="btn btn-primary btn-lg" style="margin:6px;">
    💻 الكود على GitHub
  </a>
  <a href="#run-locally" class="btn btn-secondary btn-lg" style="margin:6px;">
    🚀 كيف أشغّله؟
  </a>
</div>

---

<!-- ── ما تفعله الأداة ─────────────────────────────────────────────── -->
## 🇲🇦 ما تفعله الأداة (بالعربية)

رفع ملف CSV أو Excel ثم الضغط على زر واحد يقوم تلقائيًا بـ:

<div class="grid grid-2" style="margin:24px 0;">
  <div class="card" style="text-align:center; padding:20px;">
    <div style="font-size:2rem; margin-bottom:8px;">🗑️</div>
    <h3 style="font-size:1rem; color:#1a3a5c;">إزالة الصفوف الفارغة</h3>
    <p style="font-size:0.9rem; color:#5a5a5a;">تُزال كل الصفوف التي لا تحتوي على أي بيانات</p>
  </div>
  <div class="card" style="text-align:center; padding:20px;">
    <div style="font-size:2rem; margin-bottom:8px;">✂️</div>
    <h3 style="font-size:1rem; color:#1a3a5c;">Trim Spaces</h3>
    <p style="font-size:0.9rem; color:#5a5a5a;">إزالة المسافات الزائدة من بداية ونهاية كل خلية</p>
  </div>
  <div class="card" style="text-align:center; padding:20px;">
    <div style="font-size:2rem; margin-bottom:8px;">🔁</div>
    <h3 style="font-size:1rem; color:#1a3a5c;">إزالة التكرارات</h3>
    <p style="font-size:0.9rem; color:#5a5a5a;">حذف الصفوف المكررة بالكامل تلقائيًا</p>
  </div>
  <div class="card" style="text-align:center; padding:20px;">
    <div style="font-size:2rem; margin-bottom:8px;">📅</div>
    <h3 style="font-size:1rem; color:#1a3a5c;">إصلاح التواريخ والأرقام</h3>
    <p style="font-size:0.9rem; color:#5a5a5a;">محاولة توحيد صيغة التواريخ وتحويل النصوص لأرقام</p>
  </div>
</div>

بعد التنظيف تحصل على:
- **معاينة قبل/بعد** (أول 20 صف)
- **تنزيل الملف المنظَّف** بصيغة CSV
- **تقرير نصي** يوضح عدد الصفوف المحذوفة والتكرارات والأعمدة المُصلَحة

---

<!-- ── What it does (English) ─────────────────────────────────────── -->
## 🇬🇧 What it does (Simple English)

1. **Upload** your CSV or Excel file.
2. Click **"Clean Now"**.
3. The tool automatically:
   - Removes empty rows
   - Trims extra spaces from cells
   - Removes duplicate rows
   - Tries to fix date and number columns
4. **Preview** the result (before & after, first 20 rows).
5. **Download** the cleaned CSV file + a text report.

> Works 100% locally on your PC. No data leaves your computer.

---

<!-- ── Placeholder screenshot ────────────────────────────────────── -->
## 📸 لقطة شاشة | Screenshot

<div style="background:#f0f4f8; border:2px dashed #c0d4e8; border-radius:12px; padding:60px 20px; text-align:center; color:#7a9ab8; margin:20px 0;">
  <div style="font-size:3rem; margin-bottom:12px;">🖼️</div>
  <p style="margin:0; font-size:1rem;">لقطة شاشة للتطبيق — قريبًا<br><em>App screenshot — coming soon</em></p>
  <p style="margin:8px 0 0; font-size:0.85rem; opacity:0.7;">1280 × 720 px placeholder</p>
</div>

---

<!-- ── Run locally ────────────────────────────────────────────────── -->
## 🚀 تشغيل محلي على Windows {#run-locally}

```bat
git clone https://github.com/selghribi-blip/selghribi-blip.github.io.git
cd selghribi-blip.github.io\projects\csv-cleaner
pip install -r requirements.txt
streamlit run app.py
```

سيفتح المتصفح تلقائيًا على `http://localhost:8501`  
*Browser opens automatically at `http://localhost:8501`*

### المتطلبات | Requirements
- **Python 3.9+** — [تحميل Python](https://www.python.org/downloads/)
- **Windows 10/11**
- لا تحتاج أي سرّ أو API key

---

<!-- ── Tech stack ──────────────────────────────────────────────────── -->
## 🛠️ التقنيات المستخدمة | Tech Stack

<div style="display:flex; gap:10px; flex-wrap:wrap; margin:16px 0;">
  <span class="tech-tag">Python 3.11</span>
  <span class="tech-tag">Streamlit</span>
  <span class="tech-tag">Pandas</span>
  <span class="tech-tag">OpenPyXL</span>
  <span class="tech-tag">GitHub Pages</span>
</div>

---

<!-- ── Use cases ───────────────────────────────────────────────────── -->
## 💼 حالات استخدام | Use Cases

| المجال | الاستخدام |
|---|---|
| فريلانسرز | تنظيف قوائم العملاء والمبيعات قبل الرفع لـ CRM |
| متاجر إلكترونية | تنظيف قوائم المنتجات والمخزون |
| محللو بيانات | معالجة أولية سريعة قبل التحليل |
| مسؤولو HR | تنظيف جداول الموظفين والرواتب |

---

<!-- ── License / Privacy ───────────────────────────────────────────── -->
## ⚖️ الترخيص والخصوصية | License & Privacy

**الترخيص / License:** MIT — مجاني للاستخدام الشخصي والتجاري

**الخصوصية / Privacy:**
- ✅ الأداة تعمل **محليًا على جهازك فقط**
- ✅ **لا يُرسَل** أي ملف أو بيانات للإنترنت
- ❌ **لا ترفع** ملفات تحتوي على: كلمات مرور، بطاقات ائتمان، بيانات طبية، أرقام هوية وطنية

*This tool runs locally. No files or data are sent to the internet.
Do NOT upload sensitive data (passwords, credit cards, personal IDs, medical records).*

---

<div style="text-align:center; padding:32px; background:#fdf6ec; border-radius:16px; margin-top:32px;">
  <h3 style="color:#1a3a5c; margin-bottom:12px;">🚀 جاهز للاستخدام؟</h3>
  <p style="color:#5a5a5a; margin-bottom:20px;">حمّل الكود وشغّله على Windows خلال دقيقتين فقط.</p>
  <a href="https://github.com/selghribi-blip/selghribi-blip.github.io/tree/main/projects/csv-cleaner"
     target="_blank" rel="noopener" class="btn btn-primary btn-lg">
    💻 عرض الكود على GitHub
  </a>
</div>
