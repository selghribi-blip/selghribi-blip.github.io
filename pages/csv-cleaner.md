---
layout: page
title: "منظف CSV/Excel | CSV Excel Cleaner"
description: "أداة مجانية لتنظيف ملفات CSV وExcel — حذف التكرارات والصفوف الفارغة وإصلاح التواريخ | Free tool to clean CSV and Excel files"
lang: ar
permalink: /pages/csv-cleaner/
---

<!-- ============================================================ -->
<!-- رأس الصفحة | Page Hero                                       -->
<!-- ============================================================ -->
<div style="text-align:center; padding:48px 16px 32px; background:linear-gradient(135deg,#1a3a5c,#2d6a4f); border-radius:20px; color:#fdf6ec; margin-bottom:40px;">
  <div style="font-size:3.5rem; margin-bottom:12px;">🧹</div>
  <h1 style="color:#fdf6ec; margin-bottom:6px; font-size:2rem;">
    أداة تنظيف CSV / Excel
  </h1>
  <p style="color:rgba(255,255,255,0.75); font-size:1rem; margin-bottom:0;">
    CSV / Excel Data Cleaner Tool
  </p>
  <p style="color:rgba(255,255,255,0.65); font-size:0.85rem; margin-top:6px; margin-bottom:24px;">
    أداة مجانية ومفتوحة المصدر لتنظيف بياناتك بنقرة واحدة<br>
    <span style="font-size:0.8rem;">Free &amp; open-source — clean your data in one click</span>
  </p>
  <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
    <a href="https://github.com/selghribi-blip/selghribi-blip.github.io/tree/main/csv_cleaner"
       target="_blank" rel="noopener"
       class="btn btn-primary btn-lg">
      💻 الكود على GitHub
      <span style="display:block; font-size:0.75rem; font-weight:400;">View code on GitHub</span>
    </a>
    <a href="https://github.com/selghribi-blip/selghribi-blip.github.io/blob/main/csv_cleaner/README.md"
       target="_blank" rel="noopener"
       class="btn btn-outline-light btn-lg">
      📖 دليل التشغيل
      <span style="display:block; font-size:0.75rem; font-weight:400;">Setup guide</span>
    </a>
  </div>
</div>

<!-- ============================================================ -->
<!-- خطوات التشغيل | Quick Start                                   -->
<!-- ============================================================ -->
<div style="margin-bottom:48px;">
  <h2 style="text-align:center; color:#1a3a5c;">
    ⚡ تشغيل سريع على Windows
    <br><span style="font-size:0.9rem; font-weight:400; color:#6b7a8d;">Quick start on Windows</span>
  </h2>

  <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; margin-top:24px;">

    <div style="background:#f0f4f8; border-radius:14px; padding:24px; border-right:4px solid #c0674a;">
      <div style="font-size:2rem; margin-bottom:8px;">① تثبيت المتطلبات</div>
      <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">تثبيت المتطلبات</p>
      <p style="font-size:0.82rem; color:#6b7a8d; margin-bottom:12px;">Install requirements</p>
      <code style="display:block; background:#1a3a5c; color:#fdf6ec; padding:10px 14px; border-radius:8px; font-size:0.85rem; direction:ltr;">
        pip install -r csv_cleaner/requirements.txt
      </code>
    </div>

    <div style="background:#f0f4f8; border-radius:14px; padding:24px; border-right:4px solid #2d6a4f;">
      <div style="font-size:2rem; margin-bottom:8px;">② تشغيل التطبيق</div>
      <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">تشغيل التطبيق</p>
      <p style="font-size:0.82rem; color:#6b7a8d; margin-bottom:12px;">Run the app</p>
      <code style="display:block; background:#1a3a5c; color:#fdf6ec; padding:10px 14px; border-radius:8px; font-size:0.85rem; direction:ltr;">
        streamlit run csv_cleaner/app.py
      </code>
    </div>

    <div style="background:#f0f4f8; border-radius:14px; padding:24px; border-right:4px solid #d4a843;">
      <div style="font-size:2rem; margin-bottom:8px;">③ افتح المتصفح</div>
      <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">افتح المتصفح تلقائياً</p>
      <p style="font-size:0.82rem; color:#6b7a8d; margin-bottom:12px;">Browser opens automatically</p>
      <code style="display:block; background:#1a3a5c; color:#fdf6ec; padding:10px 14px; border-radius:8px; font-size:0.85rem; direction:ltr;">
        http://localhost:8501
      </code>
    </div>

  </div>
</div>

---

<!-- ============================================================ -->
<!-- الميزات | Features                                            -->
<!-- ============================================================ -->
<h2 style="text-align:center; color:#1a3a5c; margin-bottom:8px;">
  🛠️ ما تفعله الأداة
</h2>
<p style="text-align:center; color:#6b7a8d; font-size:0.9rem; margin-bottom:28px;">
  What the tool does
</p>

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:48px;">

  <div style="text-align:center; background:#fdf6ec; border-radius:14px; padding:24px; border:1px solid #e8e0d4;">
    <div style="font-size:2.2rem; margin-bottom:8px;">🗑️</div>
    <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">حذف الصفوف الفارغة</p>
    <p style="font-size:0.8rem; color:#6b7a8d;">Remove empty rows</p>
  </div>

  <div style="text-align:center; background:#fdf6ec; border-radius:14px; padding:24px; border:1px solid #e8e0d4;">
    <div style="font-size:2.2rem; margin-bottom:8px;">🔁</div>
    <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">حذف التكرارات</p>
    <p style="font-size:0.8rem; color:#6b7a8d;">Remove duplicate rows</p>
  </div>

  <div style="text-align:center; background:#fdf6ec; border-radius:14px; padding:24px; border:1px solid #e8e0d4;">
    <div style="font-size:2.2rem; margin-bottom:8px;">✂️</div>
    <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">إزالة المسافات الزائدة</p>
    <p style="font-size:0.8rem; color:#6b7a8d;">Trim extra spaces</p>
  </div>

  <div style="text-align:center; background:#fdf6ec; border-radius:14px; padding:24px; border:1px solid #e8e0d4;">
    <div style="font-size:2.2rem; margin-bottom:8px;">📅</div>
    <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">إصلاح تنسيقات التواريخ</p>
    <p style="font-size:0.8rem; color:#6b7a8d;">Fix date formats</p>
  </div>

  <div style="text-align:center; background:#fdf6ec; border-radius:14px; padding:24px; border:1px solid #e8e0d4;">
    <div style="font-size:2.2rem; margin-bottom:8px;">👁️</div>
    <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">معاينة قبل/بعد التنظيف</p>
    <p style="font-size:0.8rem; color:#6b7a8d;">Preview before &amp; after</p>
  </div>

  <div style="text-align:center; background:#fdf6ec; border-radius:14px; padding:24px; border:1px solid #e8e0d4;">
    <div style="font-size:2.2rem; margin-bottom:8px;">⬇️</div>
    <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">تحميل الملف + تقرير</p>
    <p style="font-size:0.8rem; color:#6b7a8d;">Download file + report</p>
  </div>

</div>

---

<!-- ============================================================ -->
<!-- القوالب الجاهزة | Presets                                    -->
<!-- ============================================================ -->
<h2 style="text-align:center; color:#1a3a5c; margin-bottom:8px;">
  📋 قوالب تنظيف جاهزة
</h2>
<p style="text-align:center; color:#6b7a8d; font-size:0.9rem; margin-bottom:28px;">
  Ready-to-use cleaning presets
</p>

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-bottom:48px;">

  <div style="background:#1a3a5c; color:#fdf6ec; border-radius:14px; padding:24px; text-align:center;">
    <div style="font-size:2rem; margin-bottom:8px;">👥</div>
    <p style="font-weight:700; margin-bottom:4px;">قوائم عملاء</p>
    <p style="font-size:0.78rem; color:rgba(255,255,255,0.65);">Client lists</p>
  </div>

  <div style="background:#2d6a4f; color:#fdf6ec; border-radius:14px; padding:24px; text-align:center;">
    <div style="font-size:2rem; margin-bottom:8px;">🛒</div>
    <p style="font-weight:700; margin-bottom:4px;">بيانات متجر</p>
    <p style="font-size:0.78rem; color:rgba(255,255,255,0.65);">Shop product data</p>
  </div>

  <div style="background:#c0674a; color:#fdf6ec; border-radius:14px; padding:24px; text-align:center;">
    <div style="font-size:2rem; margin-bottom:8px;">💼</div>
    <p style="font-weight:700; margin-bottom:4px;">بيانات فريلانسر</p>
    <p style="font-size:0.78rem; color:rgba(255,255,255,0.65);">Freelancer data</p>
  </div>

  <div style="background:#d4a843; color:#1a3a5c; border-radius:14px; padding:24px; text-align:center;">
    <div style="font-size:2rem; margin-bottom:8px;">⚙️</div>
    <p style="font-weight:700; margin-bottom:4px;">عام</p>
    <p style="font-size:0.78rem; color:rgba(26,58,92,0.7);">General purpose</p>
  </div>

</div>

---

<!-- ============================================================ -->
<!-- الصيغ المدعومة | Supported formats                           -->
<!-- ============================================================ -->
<div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:48px;">

  <div style="background:#f0f4f8; border-radius:14px; padding:28px; text-align:center;">
    <div style="font-size:2.5rem; margin-bottom:8px;">📊</div>
    <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">CSV</p>
    <p style="font-size:0.82rem; color:#6b7a8d;">ملفات CSV بترميز UTF-8 أو Latin-1<br>CSV files (UTF-8 or Latin-1)</p>
  </div>

  <div style="background:#f0f4f8; border-radius:14px; padding:28px; text-align:center;">
    <div style="font-size:2.5rem; margin-bottom:8px;">📗</div>
    <p style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">Excel</p>
    <p style="font-size:0.82rem; color:#6b7a8d;">ملفات .xlsx و .xls<br>Excel files (.xlsx and .xls)</p>
  </div>

</div>

---

<!-- ============================================================ -->
<!-- الواجهة ثنائية اللغة | Bilingual UI note                     -->
<!-- ============================================================ -->
<div style="background:#fdf6ec; border:1px solid #e8e0d4; border-radius:16px; padding:32px; margin-bottom:48px; text-align:center;">
  <div style="font-size:2.5rem; margin-bottom:12px;">🌐</div>
  <h3 style="color:#1a3a5c; margin-bottom:6px;">واجهة ثنائية اللغة دائماً</h3>
  <p style="color:#6b7a8d; font-size:0.88rem; margin-bottom:12px;">Always bilingual — no toggle needed</p>
  <p style="color:#5a5a5a; max-width:500px; margin:0 auto; line-height:1.8; font-size:0.95rem;">
    كل عنصر في التطبيق يعرض العربية والإنجليزية معاً دائماً — لا يوجد زر تبديل لغة.
    <br>
    <span style="font-size:0.82rem; color:#6b7a8d;">
      Every UI element always shows Arabic + English together. No language toggle button.
    </span>
  </p>
</div>

---

<!-- ============================================================ -->
<!-- CTA | Call to Action                                          -->
<!-- ============================================================ -->
<div style="text-align:center; padding:40px; background:#1a3a5c; border-radius:16px; color:#fff; margin-top:16px;">
  <h3 style="color:#d4a843; margin-bottom:8px;">جاهز لتنظيف بياناتك؟</h3>
  <p style="color:rgba(255,255,255,0.75); font-size:0.88rem; margin-bottom:20px;">
    Ready to clean your data?
  </p>
  <a href="https://github.com/selghribi-blip/selghribi-blip.github.io/tree/main/csv_cleaner"
     target="_blank" rel="noopener"
     class="btn btn-gold btn-lg">
    💻 احصل على الكود مجاناً
    <span style="display:block; font-size:0.78rem; font-weight:400; margin-top:2px;">Get the code for free on GitHub</span>
  </a>
</div>
