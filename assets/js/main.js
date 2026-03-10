/**
 * main.js - JavaScript الرئيسي لموقع selghribi
 * =====================================================
 * يتضمن: تنقل الهيدر، تبديل اللغة، التمرير السلس،
 * مؤشر القراءة، زر الرجوع للأعلى، نموذج الاشتراك
 * =====================================================
 */

'use strict';

// ======================================================
// تهيئة التطبيق | App Initialization
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMenuToggle();
  initReadingProgress();
  initBackToTop();
  initSmoothScroll();
  initSkillBars();
  initNewsletterForm();
  initLangToggle();
  initProjectFilters();
  initFadeOnScroll();
});

// ======================================================
// الهيدر اللاصق | Sticky Header
// ======================================================
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // تطبيق فوري عند التحميل
}

// ======================================================
// قائمة الجوال | Mobile Menu Toggle
// ======================================================
function initMenuToggle() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isActive = nav.classList.toggle('active');
    toggle.classList.toggle('active', isActive);
    toggle.setAttribute('aria-expanded', isActive);
  });

  // إغلاق القائمة عند النقر خارجها | Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', false);
    }
  });

  // إغلاق عند تغيير حجم الشاشة | Close on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      nav.classList.remove('active');
      toggle.classList.remove('active');
    }
  });
}

// ======================================================
// مؤشر تقدم القراءة | Reading Progress Indicator
// ======================================================
function initReadingProgress() {
  const progressBar = document.querySelector('.reading-progress');
  if (!progressBar) return;

  const updateProgress = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
}

// ======================================================
// زر العودة للأعلى | Back to Top Button
// ======================================================
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  const toggleVisibility = () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ======================================================
// التمرير السلس للروابط الداخلية | Smooth Scroll
// ======================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ======================================================
// أشرطة المهارات | Skill Bars Animation
// ======================================================
function initSkillBars() {
  const skills = document.querySelectorAll('.skill-progress');
  if (!skills.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const progress = entry.target;
        const width = progress.dataset.width || '0%';
        progress.style.width = width;
        observer.unobserve(progress);
      }
    });
  }, { threshold: 0.2 });

  skills.forEach(skill => {
    // حفظ العرض الأصلي وتصفير | Save original width and reset
    const originalWidth = skill.style.width;
    skill.dataset.width = originalWidth;
    skill.style.width = '0%';
    observer.observe(skill);
  });
}

// ======================================================
// نموذج الاشتراك بالنشرة | Newsletter Form
// ======================================================
function initNewsletterForm() {
  const forms = document.querySelectorAll('.newsletter-form, #newsletter-form');
  forms.forEach(form => {
    form.addEventListener('submit', handleNewsletterSubmit);
  });
}

async function handleNewsletterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const emailInput = form.querySelector('input[type="email"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const messageEl = form.querySelector('.form-message');

  if (!emailInput) return;

  const email = emailInput.value.trim();
  if (!isValidEmail(email)) {
    showFormMessage(form, 'يرجى إدخال بريد إلكتروني صحيح | Please enter a valid email', 'error');
    return;
  }

  // تعطيل الزر أثناء الإرسال | Disable button during submission
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '...';
  }

  try {
    // إرسال للـ Formspree أو أي خدمة | Submit to Formspree or any service
    const action = form.getAttribute('action');
    if (action) {
      const response = await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        showFormMessage(form, '✅ تم الاشتراك بنجاح! شكراً لك | Successfully subscribed! Thank you', 'success');
        form.reset();
      } else {
        throw new Error('Submission failed');
      }
    } else {
      // وضع تجريبي | Demo mode
      showFormMessage(form, '✅ تم الاشتراك بنجاح! | Successfully subscribed!', 'success');
      form.reset();
    }
  } catch {
    showFormMessage(form, '❌ حدث خطأ، حاول مرة أخرى | An error occurred, please try again', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || 'اشترك';
    }
  }
}

function showFormMessage(form, message, type) {
  let el = form.querySelector('.form-message');
  if (!el) {
    el = document.createElement('p');
    el.className = 'form-message';
    form.appendChild(el);
  }
  el.textContent = message;
  el.className = `form-message alert alert-${type}`;
  el.style.marginTop = '12px';

  // إخفاء تلقائي | Auto hide
  if (type === 'success') {
    setTimeout(() => { el.remove(); }, 5000);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ======================================================
// تبديل اللغة | Language Toggle
// ======================================================
function initLangToggle() {
  const buttons = document.querySelectorAll('.lang-toggle button[data-lang]');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      setLanguage(lang);

      // تحديث الأزرار النشطة | Update active buttons
      buttons.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    });
  });

  // تطبيق اللغة المحفوظة | Apply saved language
  const savedLang = localStorage.getItem('preferred-lang') || 'ar';
  setLanguage(savedLang);
  buttons.forEach(b => b.classList.toggle('active', b.dataset.lang === savedLang));
}

function setLanguage(lang) {
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  localStorage.setItem('preferred-lang', lang);

  // إظهار/إخفاء المحتوى حسب اللغة | Show/hide content by language
  document.querySelectorAll('[data-lang-show]').forEach(el => {
    el.style.display = el.dataset.langShow === lang ? '' : 'none';
  });
}

// ======================================================
// فلاتر المشاريع | Project Filters
// ======================================================
function initProjectFilters() {
  const filters = document.querySelectorAll('.filter-btn');
  const projects = document.querySelectorAll('.project-card, [data-tech]');
  if (!filters.length || !projects.length) return;

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // تحديث الأزرار النشطة | Update active buttons
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // تصفية المشاريع | Filter projects
      projects.forEach(project => {
        const tech = project.dataset.tech || '';
        const show = filter === 'all' || tech.includes(filter);
        project.style.display = show ? '' : 'none';

        if (show) {
          project.style.animation = 'fadeInUp 0.4s ease forwards';
        }
      });
    });
  });
}

// ======================================================
// تأثير الظهور عند التمرير | Fade on Scroll
// ======================================================
function initFadeOnScroll() {
  const elements = document.querySelectorAll('.fade-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
        entry.target.style.opacity = '1';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

// ======================================================
// نسخ للحافظة | Copy to Clipboard
// ======================================================
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const target = btn.dataset.copy;
    const el = target ? document.querySelector(target) : btn.previousElementSibling;
    if (!el) return;

    const text = el.textContent || el.value || '';
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = '✓ تم النسخ';
      setTimeout(() => { btn.textContent = original; }, 2000);
    } catch {
      // fallback
    }
  });
});
