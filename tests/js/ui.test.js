// اختبارات المهارات واللغة والفلاتر والحافظة | Skill bars, language, filters, clipboard tests
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import {
  loadMain,
  observers,
  resetGlobals,
  stubClipboard,
  stubIntersectionObserver,
  trackGlobalListeners,
} from './helpers.js';

beforeAll(() => {
  trackGlobalListeners();
});

beforeEach(() => {
  stubIntersectionObserver();
});

afterEach(() => {
  resetGlobals();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('initSkillBars', () => {
  it('resets widths and restores them once visible', async () => {
    await loadMain(`
      <div class="skill-progress" style="width: 80%"></div>
      <div class="skill-progress" style="width: 45%"></div>
    `);

    const bars = [...document.querySelectorAll('.skill-progress')];
    expect(bars.map((b) => b.style.width)).toEqual(['0%', '0%']);
    expect(bars.map((b) => b.dataset.width)).toEqual(['80%', '45%']);

    const observer = observers[0];
    expect(observer.options).toEqual({ threshold: 0.2 });
    expect(observer.observed).toEqual(bars);

    observer.trigger([bars[0]]);
    expect(bars[0].style.width).toBe('80%');
    expect(bars[1].style.width).toBe('0%');
    expect(observer.unobserved).toEqual([bars[0]]);
  });

  it('ignores non-intersecting entries', async () => {
    await loadMain('<div class="skill-progress" style="width: 70%"></div>');
    const bar = document.querySelector('.skill-progress');

    observers[0].trigger([bar], false);
    expect(bar.style.width).toBe('0%');
    expect(observers[0].unobserved).toEqual([]);
  });

  it('defaults to 0% when no inline width was set', async () => {
    await loadMain('<div class="skill-progress"></div>');
    const bar = document.querySelector('.skill-progress');

    observers[0].trigger();
    expect(bar.style.width).toBe('0%');
  });

  it('creates no observer when there are no skill bars', async () => {
    await loadMain('<div class="fade-on-scroll"></div>');
    expect(observers).toHaveLength(1); // fade observer only
  });
});

describe('initLangToggle / setLanguage', () => {
  const html = `
    <div class="lang-toggle">
      <button data-lang="ar">ع</button>
      <button data-lang="en">EN</button>
    </div>
    <span data-lang-show="ar">عربي</span>
    <span data-lang-show="en">English</span>
  `;

  it('defaults to Arabic with RTL direction', async () => {
    await loadMain(html);

    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(localStorage.getItem('preferred-lang')).toBe('ar');
    expect(document.querySelector('[data-lang-show="ar"]').style.display).toBe('');
    expect(document.querySelector('[data-lang-show="en"]').style.display).toBe('none');
    expect(document.querySelector('button[data-lang="ar"]').classList.contains('active')).toBe(true);
  });

  it('applies the language saved in localStorage', async () => {
    localStorage.setItem('preferred-lang', 'en');
    await loadMain(html);

    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.querySelector('button[data-lang="en"]').classList.contains('active')).toBe(true);
    expect(document.querySelector('button[data-lang="ar"]').classList.contains('active')).toBe(false);
  });

  it('switches language and active button on click', async () => {
    await loadMain(html);
    document.querySelector('button[data-lang="en"]').click();

    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(localStorage.getItem('preferred-lang')).toBe('en');
    expect(document.querySelector('[data-lang-show="en"]').style.display).toBe('');
    expect(document.querySelector('[data-lang-show="ar"]').style.display).toBe('none');
    expect(document.querySelector('button[data-lang="en"]').classList.contains('active')).toBe(true);
    expect(document.querySelector('button[data-lang="ar"]').classList.contains('active')).toBe(false);
  });

  it('leaves the document untouched when there are no toggle buttons', async () => {
    await loadMain('<div class="lang-toggle"></div>');

    expect(document.documentElement.getAttribute('lang')).toBeNull();
    expect(localStorage.getItem('preferred-lang')).toBeNull();
  });
});

describe('initProjectFilters', () => {
  const html = `
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="python">Python</button>
    <button class="filter-btn" data-filter="jekyll">Jekyll</button>
    <div class="project-card" id="a" data-tech="python,flask"></div>
    <div class="project-card" id="b" data-tech="jekyll,scss"></div>
    <div class="project-card" id="c"></div>
  `;

  it('filters cards by tech tag and marks the active button', async () => {
    await loadMain(html);
    document.querySelector('[data-filter="python"]').click();

    expect(document.getElementById('a').style.display).toBe('');
    expect(document.getElementById('a').style.animation).toBe('fadeInUp 0.4s ease forwards');
    expect(document.getElementById('b').style.display).toBe('none');
    expect(document.getElementById('c').style.display).toBe('none');
    expect(document.querySelector('[data-filter="python"]').classList.contains('active')).toBe(true);
    expect(document.querySelector('[data-filter="all"]').classList.contains('active')).toBe(false);
  });

  it('shows every card for the "all" filter', async () => {
    await loadMain(html);
    document.querySelector('[data-filter="jekyll"]').click();
    document.querySelector('[data-filter="all"]').click();

    ['a', 'b', 'c'].forEach((id) => {
      expect(document.getElementById(id).style.display).toBe('');
    });
  });

  it('does nothing when filters or projects are missing', async () => {
    await loadMain('<button class="filter-btn" data-filter="all">All</button>');
    expect(() => document.querySelector('.filter-btn').click()).not.toThrow();
    expect(document.querySelector('.filter-btn').classList.contains('active')).toBe(false);
  });
});

describe('initFadeOnScroll', () => {
  it('hides elements then fades them in when observed', async () => {
    await loadMain('<div class="fade-on-scroll" id="f1"></div><div class="fade-on-scroll" id="f2"></div>');

    const elements = [...document.querySelectorAll('.fade-on-scroll')];
    expect(elements.map((el) => el.style.opacity)).toEqual(['0', '0']);

    const observer = observers[0];
    expect(observer.options).toEqual({ threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    observer.trigger([elements[0]]);
    expect(elements[0].classList.contains('fade-in-up')).toBe(true);
    expect(elements[0].style.opacity).toBe('1');
    expect(observer.unobserved).toEqual([elements[0]]);

    observer.trigger([elements[1]], false);
    expect(elements[1].classList.contains('fade-in-up')).toBe(false);
    expect(elements[1].style.opacity).toBe('0');
  });

  it('creates no observer when nothing needs fading', async () => {
    await loadMain('<div></div>');
    expect(observers).toHaveLength(0);
  });
});

describe('copy to clipboard', () => {
  it('copies the referenced target text and confirms briefly', async () => {
    vi.useFakeTimers();
    const writeText = stubClipboard();
    await loadMain('<code id="snippet">npm test</code><button class="copy-btn" data-copy="#snippet">نسخ</button>');

    const btn = document.querySelector('.copy-btn');
    btn.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(writeText).toHaveBeenCalledWith('npm test');
    expect(btn.textContent).toBe('✓ تم النسخ');

    await vi.advanceTimersByTimeAsync(2000);
    expect(btn.textContent).toBe('نسخ');
  });

  it('falls back to the previous sibling when no data-copy is given', async () => {
    const writeText = stubClipboard();
    await loadMain('<pre>bundle exec jekyll build</pre><button class="copy-btn">نسخ</button>');

    document.querySelector('.copy-btn').click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('bundle exec jekyll build');
  });

  it('reads the value of inputs that have no text content', async () => {
    const writeText = stubClipboard();
    await loadMain('<input id="token" value="secret-value" /><button class="copy-btn" data-copy="#token">نسخ</button>');

    document.querySelector('.copy-btn').click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('secret-value');
  });

  it('copies an empty string when the target has neither text nor value', async () => {
    const writeText = stubClipboard();
    await loadMain('<span id="empty"></span><button class="copy-btn" data-copy="#empty">نسخ</button>');

    document.querySelector('.copy-btn').click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('');
  });

  it('does nothing when the target is missing', async () => {
    const writeText = stubClipboard();
    await loadMain('<button class="copy-btn" data-copy="#nope">نسخ</button>');

    const btn = document.querySelector('.copy-btn');
    btn.click();
    await Promise.resolve();

    expect(writeText).not.toHaveBeenCalled();
    expect(btn.textContent).toBe('نسخ');
  });

  it('keeps the original label when the clipboard write fails', async () => {
    stubClipboard(() => Promise.reject(new Error('denied')));
    await loadMain('<code id="s">x</code><button class="copy-btn" data-copy="#s">نسخ</button>');

    const btn = document.querySelector('.copy-btn');
    btn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(btn.textContent).toBe('نسخ');
  });
});
