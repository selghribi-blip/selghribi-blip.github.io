---
layout: page
title: "منظّف CSV/Excel | CSV/Excel Cleaner"
description: "أداة Streamlit لتنظيف ملفات CSV و Excel — مجانية وسهلة الاستخدام"
lang: ar
permalink: /pages/csv-cleaner/
---

<div style="text-align:center; margin-bottom:40px;">
  <div style="font-size:3.5rem; margin-bottom:12px;">🧹</div>
  <h1 style="color:#1a3a5c; margin-bottom:8px;">منظّف ملفات CSV / Excel</h1>
  <p style="font-size:0.85rem; color:#6c757d; font-style:italic; direction:ltr;">CSV / Excel Data Cleaner Tool</p>
  <p style="color:#5a5a5a; max-width:600px; margin:16px auto 0; line-height:1.8;">
    أداة بسيطة وسريعة لتنظيف ملفات البيانات — تحذف الصفوف الفارغة والمكررة، تُصلح المسافات الزائدة، وتُخرج ملفاً نظيفاً جاهزاً للاستخدام.
  </p>
  <p style="font-size:0.85rem; color:#6c757d; font-style:italic; direction:ltr; max-width:600px; margin:8px auto 0;">
    Simple and fast tool to clean data files — removes empty rows, duplicates, trims spaces, and delivers a clean ready-to-use file.
  </p>
</div>

---

## ✨ المزايا الرئيسية
## ✨ Key Features

<div class="grid grid-3" style="margin:32px 0;">

  <div style="background:#f8f9fa; border-radius:12px; padding:24px; text-align:center; border:1px solid #e9ecef;">
    <div style="font-size:2rem; margin-bottom:12px;">🗑️</div>
    <h3 style="color:#1a3a5c; font-size:1rem; margin-bottom:6px;">حذف الصفوف الفارغة والمكررة</h3>
    <p style="font-size:0.8rem; color:#6c757d; font-style:italic; direction:ltr; margin:0;">Remove empty &amp; duplicate rows</p>
  </div>

  <div style="background:#f8f9fa; border-radius:12px; padding:24px; text-align:center; border:1px solid #e9ecef;">
    <div style="font-size:2rem; margin-bottom:12px;">✂️</div>
    <h3 style="color:#1a3a5c; font-size:1rem; margin-bottom:6px;">قصّ المسافات الزائدة</h3>
    <p style="font-size:0.8rem; color:#6c757d; font-style:italic; direction:ltr; margin:0;">Trim extra whitespace</p>
  </div>

  <div style="background:#f8f9fa; border-radius:12px; padding:24px; text-align:center; border:1px solid #e9ecef;">
    <div style="font-size:2rem; margin-bottom:12px;">👁️</div>
    <h3 style="color:#1a3a5c; font-size:1rem; margin-bottom:6px;">معاينة قبل/بعد التنظيف</h3>
    <p style="font-size:0.8rem; color:#6c757d; font-style:italic; direction:ltr; margin:0;">Before / after preview</p>
  </div>

  <div style="background:#f8f9fa; border-radius:12px; padding:24px; text-align:center; border:1px solid #e9ecef;">
    <div style="font-size:2rem; margin-bottom:12px;">⬇️</div>
    <h3 style="color:#1a3a5c; font-size:1rem; margin-bottom:6px;">تحميل CSV أو Excel</h3>
    <p style="font-size:0.8rem; color:#6c757d; font-style:italic; direction:ltr; margin:0;">Download as CSV or Excel</p>
  </div>

  <div style="background:#f8f9fa; border-radius:12px; padding:24px; text-align:center; border:1px solid #e9ecef;">
    <div style="font-size:2rem; margin-bottom:12px;">📋</div>
    <h3 style="color:#1a3a5c; font-size:1rem; margin-bottom:6px;">تقرير تفصيلي بالتغييرات</h3>
    <p style="font-size:0.8rem; color:#6c757d; font-style:italic; direction:ltr; margin:0;">Detailed change report</p>
  </div>

  <div style="background:#f8f9fa; border-radius:12px; padding:24px; text-align:center; border:1px solid #e9ecef;">
    <div style="font-size:2rem; margin-bottom:12px;">🌐</div>
    <h3 style="color:#1a3a5c; font-size:1rem; margin-bottom:6px;">واجهة عربي + إنجليزي</h3>
    <p style="font-size:0.8rem; color:#6c757d; font-style:italic; direction:ltr; margin:0;">Bilingual Arabic + English UI</p>
  </div>

</div>

---

## 🚀 كيف تشغّل الأداة؟
## 🚀 How to Run

<div style="background:#1a3a5c; color:#fdf6ec; border-radius:12px; padding:28px; margin:24px 0;">

<p style="margin-bottom:8px; font-weight:600;">المتطلبات | Requirements</p>
<p style="font-size:0.85rem; color:#aac4de; margin-bottom:16px; direction:ltr; font-style:italic;">Python 3.9+ must be installed on your machine.</p>

<pre style="background:#0d1f33; color:#7ec8e3; padding:16px; border-radius:8px; direction:ltr; text-align:left; overflow-x:auto; font-size:0.9rem;"><code># 1. انتقل إلى مجلد المشروع | Go to project folder
cd projects/csv-cleaner

# 2. ثبّت المكتبات | Install dependencies
pip install -r requirements.txt

# 3. شغّل التطبيق | Run the app
streamlit run app.py</code></pre>

<p style="margin-top:16px; font-size:0.9rem;">
  بعد التشغيل، افتح المتصفح على:
  <code style="background:#0d1f33; padding:2px 8px; border-radius:4px; direction:ltr;">http://localhost:8501</code>
</p>
<p style="font-size:0.8rem; color:#aac4de; direction:ltr; font-style:italic; margin-top:4px;">
  After running, open your browser at: http://localhost:8501
</p>

</div>

---

## 📖 خطوات الاستخدام
## 📖 How to Use

<div class="grid grid-4" style="margin-top:32px;">
  <div style="text-align:center; padding:20px;">
    <div style="font-size:2rem; margin-bottom:10px;">1️⃣</div>
    <h4 style="color:#1a3a5c; margin-bottom:6px;">ارفع ملفك</h4>
    <p style="font-size:0.8rem; color:#6c757d; font-style:italic; direction:ltr; margin:0;">Upload your file</p>
  </div>
  <div style="text-align:center; padding:20px;">
    <div style="font-size:2rem; margin-bottom:10px;">2️⃣</div>
    <h4 style="color:#1a3a5c; margin-bottom:6px;">اختر خيارات التنظيف</h4>
    <p style="font-size:0.8rem; color:#6c757d; font-style:italic; direction:ltr; margin:0;">Choose cleaning options</p>
  </div>
  <div style="text-align:center; padding:20px;">
    <div style="font-size:2rem; margin-bottom:10px;">3️⃣</div>
    <h4 style="color:#1a3a5c; margin-bottom:6px;">اضغط تنظيف</h4>
    <p style="font-size:0.8rem; color:#6c757d; font-style:italic; direction:ltr; margin:0;">Click Clean</p>
  </div>
  <div style="text-align:center; padding:20px;">
    <div style="font-size:2rem; margin-bottom:10px;">4️⃣</div>
    <h4 style="color:#1a3a5c; margin-bottom:6px;">حمّل الملف المنظّف</h4>
    <p style="font-size:0.8rem; color:#6c757d; font-style:italic; direction:ltr; margin:0;">Download clean file</p>
  </div>
</div>

---

## 💻 الكود المصدري
## 💻 Source Code

<div style="text-align:center; padding:32px; background:#f8f9fa; border-radius:12px; margin-top:16px;">
  <p style="color:#5a5a5a; margin-bottom:16px;">الكود متاح مجاناً داخل هذا المستودع</p>
  <p style="font-size:0.85rem; color:#6c757d; font-style:italic; direction:ltr; margin-bottom:20px;">Source code is freely available in this repository</p>
  <a href="https://github.com/selghribi-blip/selghribi-blip.github.io/tree/main/projects/csv-cleaner"
     target="_blank" rel="noopener" class="btn btn-primary">
    💻 عرض الكود على GitHub | View on GitHub
  </a>
</div>

---

<div style="text-align:center; padding:40px; background:#1a3a5c; border-radius:16px; color:#fff; margin-top:32px;">
  <h3 style="color:#d4a843; margin-bottom:8px;">هل تريد نسخة مخصصة لعملك؟</h3>
  <p style="font-size:0.85rem; color:#aac4de; font-style:italic; direction:ltr; margin-bottom:20px;">Need a custom version for your business?</p>
  <a href="{{ '/pages/contact' | relative_url }}" class="btn btn-gold btn-lg">
    📩 تواصل معي الآن | Contact Me
  </a>
</div>
