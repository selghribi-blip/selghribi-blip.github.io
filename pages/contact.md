---
layout: page
title: "تواصل معي | Contact"
description: "تواصل معي للمشاريع الحرة، التعاون، أو أي استفسار"
lang: ar
permalink: /pages/contact/
---

<div class="grid grid-2" style="gap:48px; margin-top:16px;">

  <!-- فورم التواصل | Contact Form -->
  <div>
    <h2 style="font-size:1.4rem; margin-bottom:24px;">📩 أرسل لي رسالة</h2>

    <!-- يعمل مع Formspree المجاني | Works with free Formspree -->
    <!-- استبدل YOUR_FORM_ID بالمعرف من formspree.io -->
    <form
      action=""
      method="POST"
      id="contact-form"
      novalidate
    >
      <!-- استبدل الـ action بـ: https://formspree.io/f/YOUR_FORM_ID -->

      <div class="form-group">
        <label for="name">الاسم الكامل *</label>
        <input type="text" id="name" name="name" placeholder="اسمك هنا..." required>
      </div>

      <div class="form-group">
        <label for="email">البريد الإلكتروني *</label>
        <input type="email" id="email" name="email" placeholder="email@example.com" required dir="ltr">
      </div>

      <div class="form-group">
        <label for="subject">الموضوع</label>
        <select id="subject" name="subject">
          <option value="">اختر الموضوع...</option>
          <option value="project">مشروع جديد</option>
          <option value="collaboration">تعاون</option>
          <option value="consulting">استشارة تقنية</option>
          <option value="other">أخرى</option>
        </select>
      </div>

      <div class="form-group">
        <label for="message">رسالتك *</label>
        <textarea id="message" name="message" placeholder="اكتب رسالتك هنا..." rows="6" required></textarea>
      </div>

      <button type="submit" class="btn btn-primary btn-lg" style="width:100%; justify-content:center;">
        إرسال الرسالة 🚀
      </button>
    </form>
  </div>

  <!-- معلومات التواصل | Contact Info -->
  <div>
    <h2 style="font-size:1.4rem; margin-bottom:24px;">📌 معلومات التواصل</h2>

    <div style="display:flex; flex-direction:column; gap:20px; margin-bottom:32px;">
      <div style="display:flex; align-items:center; gap:16px; padding:16px; background:#fdf6ec; border-radius:12px;">
        <div style="font-size:1.5rem; min-width:40px; text-align:center;">🌐</div>
        <div>
          <div style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">موقعي الرئيسي</div>
          <a href="https://artsmoroccan.me" target="_blank" rel="noopener" style="color:#c0674a;">artsmoroccan.me</a>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:16px; padding:16px; background:#fdf6ec; border-radius:12px;">
        <div style="font-size:1.5rem; min-width:40px; text-align:center;">💻</div>
        <div>
          <div style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">GitHub</div>
          <a href="https://github.com/selghribi-blip" target="_blank" rel="noopener" style="color:#c0674a;">github.com/selghribi-blip</a>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:16px; padding:16px; background:#fdf6ec; border-radius:12px;">
        <div style="font-size:1.5rem; min-width:40px; text-align:center;">🇲🇦</div>
        <div>
          <div style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">الموقع</div>
          <span style="color:#5a5a5a;">المملكة المغربية</span>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:16px; padding:16px; background:#fdf6ec; border-radius:12px;">
        <div style="font-size:1.5rem; min-width:40px; text-align:center;">⏰</div>
        <div>
          <div style="font-weight:700; color:#1a3a5c; margin-bottom:4px;">وقت الرد</div>
          <span style="color:#5a5a5a;">خلال 24-48 ساعة</span>
        </div>
      </div>
    </div>

    <!-- روابط السوشال -->
    <h3 style="font-size:1rem; margin-bottom:16px; color:#1a3a5c;">تابعني على</h3>
    <div class="social-links dark">
      <a href="https://github.com/selghribi-blip" class="social-link" aria-label="GitHub" target="_blank" rel="noopener">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
      </a>
      <a href="https://ko-fi.com/selghribi" class="social-link" aria-label="Ko-fi" target="_blank" rel="noopener" style="font-size:1.1rem;">☕</a>
      <a href="https://gumroad.com/selghribi" class="social-link" aria-label="Gumroad" target="_blank" rel="noopener" style="font-size:1rem;">🛍️</a>
    </div>

    <!-- حجز موعد استشارة -->
    <div style="margin-top:32px; padding:20px; background:#1a3a5c; border-radius:12px; text-align:center;">
      <p style="color:rgba(255,255,255,0.8); font-size:0.9rem; margin-bottom:12px;">
        تريد استشارة سريعة؟
      </p>
      <a href="mailto:WYNM72627@GMAIL.COM?subject=استشارة تقنية - selghribi" class="btn btn-gold btn-sm">
        📅 احجز استشارة مجانية
      </a>
    </div>
  </div>
</div>

<script>
// معالج نموذج التواصل | Contact Form Handler
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  const action = this.getAttribute('action');

  if (!action) {
    // وضع تجريبي | Demo mode
    btn.textContent = '✅ تم إرسال رسالتك!';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'إرسال الرسالة 🚀';
      btn.disabled = false;
      this.reset();
    }, 3000);
    return;
  }

  btn.textContent = '...جارٍ الإرسال';
  btn.disabled = true;

  try {
    const data = new FormData(this);
    const response = await fetch(action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      btn.textContent = '✅ تم إرسال رسالتك بنجاح!';
      this.reset();
    } else {
      btn.textContent = '❌ خطأ، حاول مرة أخرى';
    }
  } catch {
    btn.textContent = '❌ خطأ في الإرسال';
  } finally {
    setTimeout(() => {
      btn.textContent = 'إرسال الرسالة 🚀';
      btn.disabled = false;
    }, 4000);
  }
});
</script>
