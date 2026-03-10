---
layout: page
title: "معرض الأعمال | Portfolio"
description: "مشاريعي وأعمالي في تطوير الويب والتصميم"
lang: ar
permalink: /pages/portfolio/
---

<div style="text-align:center; margin-bottom:32px;">
  <p>فلترة حسب التقنية | Filter by Technology</p>
  <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:12px;">
    <button class="btn btn-primary btn-sm filter-btn active" data-filter="all">الكل</button>
    <button class="btn btn-secondary btn-sm filter-btn" data-filter="html">HTML/CSS</button>
    <button class="btn btn-secondary btn-sm filter-btn" data-filter="javascript">JavaScript</button>
    <button class="btn btn-secondary btn-sm filter-btn" data-filter="jekyll">Jekyll</button>
    <button class="btn btn-secondary btn-sm filter-btn" data-filter="python">Python</button>
  </div>
</div>

<div class="grid grid-2">

  <!-- Arts Moroccan -->
  <div class="project-card featured" data-tech="html css javascript e-commerce">
    <div class="project-featured-badge">⭐ مميز</div>
    <div class="project-image">
      <div style="height:220px; background:linear-gradient(135deg, #1a3a5c, #c0674a); display:flex; align-items:center; justify-content:center; position:relative;">
        <div style="text-align:center; color:#fdf6ec;">
          <div style="font-size:3rem; margin-bottom:8px;">🏺</div>
          <div style="font-family:'Playfair Display', serif; font-size:1.2rem; font-weight:700;">Arts Moroccan</div>
          <div style="font-size:0.8rem; opacity:0.8; margin-top:4px;">artsmoroccan.me</div>
        </div>
        <div class="project-overlay">
          <a href="https://artsmoroccan.me" target="_blank" rel="noopener" class="btn btn-primary btn-sm">🌐 زيارة الموقع</a>
          <a href="https://github.com/selghribi-blip" target="_blank" rel="noopener" class="btn btn-outline-light btn-sm">💻 الكود</a>
        </div>
      </div>
    </div>
    <div class="project-body">
      <h3 class="project-title">Arts Moroccan 🏺</h3>
      <p style="font-size:0.9rem; color:#5a5a5a; margin-bottom:12px; line-height:1.7;">
        موقع تجارة إلكترونية متكامل للفنون والحرف المغربية التقليدية. يُبرز جمال الحرف اليدوية المغربية ويتيح بيعها للعالم. مبني بـ HTML/CSS/JavaScript خالص بدون أي framework.
      </p>
      <div class="project-tech">
        <span class="tech-tag">HTML5</span>
        <span class="tech-tag">CSS3</span>
        <span class="tech-tag">JavaScript</span>
        <span class="tech-tag">E-Commerce</span>
        <span class="tech-tag">Responsive</span>
      </div>
    </div>
  </div>

  <!-- Content Factory -->
  <div class="project-card" data-tech="jekyll github-actions python scss">
    <div class="project-image">
      <div style="height:220px; background:linear-gradient(135deg, #2d6a4f, #1a3a5c); display:flex; align-items:center; justify-content:center; position:relative;">
        <div style="text-align:center; color:#fdf6ec;">
          <div style="font-size:3rem; margin-bottom:8px;">🏭</div>
          <div style="font-family:'Playfair Display', serif; font-size:1.2rem; font-weight:700;">Content Factory</div>
          <div style="font-size:0.8rem; opacity:0.8; margin-top:4px;">مصنع المحتوى</div>
        </div>
        <div class="project-overlay">
          <a href="{{ '/' | relative_url }}" class="btn btn-primary btn-sm">🌐 زيارة</a>
          <a href="https://github.com/selghribi-blip/selghribi-blip.github.io" target="_blank" rel="noopener" class="btn btn-outline-light btn-sm">💻 كود</a>
        </div>
      </div>
    </div>
    <div class="project-body">
      <h3 class="project-title">مصنع المحتوى 🏭</h3>
      <p style="font-size:0.9rem; color:#5a5a5a; margin-bottom:12px; line-height:1.7;">
        مدونة تقنية عربية مع أتمتة كاملة — 6 GitHub Actions Workflows، Python scripts لإنشاء المحتوى، دعم RTL كامل. مجاني 100% عبر GitHub Student Pack.
      </p>
      <div class="project-tech">
        <span class="tech-tag">Jekyll</span>
        <span class="tech-tag">GitHub Actions</span>
        <span class="tech-tag">Python</span>
        <span class="tech-tag">SCSS</span>
        <span class="tech-tag">RTL</span>
      </div>
    </div>
  </div>

</div>

---

<div style="text-align:center; padding:40px; background:#fdf6ec; border-radius:16px; margin-top:32px;">
  <h3 style="color:#1a3a5c; margin-bottom:12px;">🔄 مشاريع قادمة</h3>
  <p style="color:#5a5a5a; margin-bottom:20px;">أعمل دائماً على مشاريع جديدة. تابعني لتكون أول من يعرف!</p>
  <a href="{{ '/pages/contact' | relative_url }}" class="btn btn-primary">
    📩 تواصل لمشروع مشترك
  </a>
</div>
