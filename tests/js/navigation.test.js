// اختبارات الهيدر والقائمة والتمرير | Header, menu, scroll behaviour tests
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import {
  loadMain,
  fire,
  resetGlobals,
  setScrollY,
  setInnerWidth,
  setDocumentScroll,
  stubIntersectionObserver,
  trackGlobalListeners,
} from './helpers.js';

beforeAll(() => {
  trackGlobalListeners();
});

beforeEach(() => {
  stubIntersectionObserver();
  window.scrollTo = vi.fn();
  setScrollY(0);
  setInnerWidth(1200);
});

afterEach(() => {
  resetGlobals();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('initHeader', () => {
  const html = '<header class="site-header"></header>';

  it('applies the scrolled class immediately when already scrolled past 50px', async () => {
    setScrollY(120);
    await loadMain(html);

    expect(document.querySelector('.site-header').classList.contains('scrolled')).toBe(true);
  });

  it('toggles the scrolled class as the page scrolls', async () => {
    await loadMain(html);
    const header = document.querySelector('.site-header');
    expect(header.classList.contains('scrolled')).toBe(false);

    setScrollY(51);
    fire(window, 'scroll');
    expect(header.classList.contains('scrolled')).toBe(true);

    setScrollY(10);
    fire(window, 'scroll');
    expect(header.classList.contains('scrolled')).toBe(false);
  });

  it('does nothing when there is no header', async () => {
    await expect(loadMain('<div></div>')).resolves.toBeUndefined();
  });
});

describe('initMenuToggle', () => {
  const html = `
    <button class="menu-toggle" aria-expanded="false">menu</button>
    <nav class="site-nav"><a href="#about">about</a></nav>
  `;

  it('opens and closes the menu on toggle clicks', async () => {
    await loadMain(html);
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');

    toggle.click();
    expect(nav.classList.contains('active')).toBe(true);
    expect(toggle.classList.contains('active')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.click();
    expect(nav.classList.contains('active')).toBe(false);
    expect(toggle.classList.contains('active')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the menu when clicking outside of it', async () => {
    await loadMain(`${html}<main id="outside">content</main>`);
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');

    toggle.click();
    expect(nav.classList.contains('active')).toBe(true);

    document.getElementById('outside').click();
    expect(nav.classList.contains('active')).toBe(false);
    expect(toggle.classList.contains('active')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the menu open when clicking inside the nav', async () => {
    await loadMain(html);
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');

    toggle.click();
    nav.querySelector('a').click();
    expect(nav.classList.contains('active')).toBe(true);
  });

  it('closes the menu when the viewport grows past 768px', async () => {
    setInnerWidth(500);
    await loadMain(html);
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');

    toggle.click();
    fire(window, 'resize');
    expect(nav.classList.contains('active')).toBe(true);

    setInnerWidth(1024);
    fire(window, 'resize');
    expect(nav.classList.contains('active')).toBe(false);
    expect(toggle.classList.contains('active')).toBe(false);
  });

  it('does nothing when the toggle or nav is missing', async () => {
    await loadMain('<nav class="site-nav"></nav>');
    expect(document.querySelector('.site-nav').classList.contains('active')).toBe(false);
  });
});

describe('initReadingProgress', () => {
  const html = '<div class="reading-progress"></div>';

  it('sets the bar width to the scrolled percentage', async () => {
    await loadMain(html);
    setDocumentScroll({ scrollTop: 250, scrollHeight: 1000, clientHeight: 500 });

    fire(window, 'scroll');
    expect(document.querySelector('.reading-progress').style.width).toBe('50%');
  });

  it('uses 0% when the document is not scrollable', async () => {
    await loadMain(html);
    setDocumentScroll({ scrollTop: 0, scrollHeight: 500, clientHeight: 500 });

    fire(window, 'scroll');
    expect(document.querySelector('.reading-progress').style.width).toBe('0%');
  });

  it('does nothing when the progress bar is absent', async () => {
    await loadMain('<div></div>');
    setDocumentScroll({ scrollTop: 10, scrollHeight: 1000, clientHeight: 500 });
    expect(() => fire(window, 'scroll')).not.toThrow();
  });
});

describe('initBackToTop', () => {
  const html = '<button class="back-to-top">top</button>';

  it('shows the button only past 300px of scroll', async () => {
    await loadMain(html);
    const btn = document.querySelector('.back-to-top');

    setScrollY(301);
    fire(window, 'scroll');
    expect(btn.classList.contains('visible')).toBe(true);

    setScrollY(100);
    fire(window, 'scroll');
    expect(btn.classList.contains('visible')).toBe(false);
  });

  it('scrolls smoothly to the top when clicked', async () => {
    await loadMain(html);
    document.querySelector('.back-to-top').click();

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('does nothing when the button is absent', async () => {
    await loadMain('<div></div>');
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

describe('initSmoothScroll', () => {
  it('scrolls to the target offset by the header height plus spacing', async () => {
    await loadMain(`
      <header class="site-header"></header>
      <a id="link" href="#section">go</a>
      <section id="section"></section>
    `);

    const header = document.querySelector('.site-header');
    Object.defineProperty(header, 'offsetHeight', { value: 64, configurable: true });
    const section = document.getElementById('section');
    section.getBoundingClientRect = () => ({ top: 400 });
    setScrollY(100);

    const link = document.getElementById('link');
    const event = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 400 + 100 - 64 - 16, behavior: 'smooth' });
  });

  it('falls back to a zero header height when there is no header', async () => {
    await loadMain('<a id="link" href="#section">go</a><section id="section"></section>');
    document.getElementById('section').getBoundingClientRect = () => ({ top: 200 });

    document.getElementById('link').click();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 200 - 16, behavior: 'smooth' });
  });

  it('ignores bare hash links and missing targets', async () => {
    await loadMain('<a id="bare" href="#">x</a><a id="missing" href="#nope">y</a>');

    const bareEvent = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    document.getElementById('bare').dispatchEvent(bareEvent);
    const missingEvent = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    document.getElementById('missing').dispatchEvent(missingEvent);

    expect(bareEvent.defaultPrevented).toBe(false);
    expect(missingEvent.defaultPrevented).toBe(false);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
