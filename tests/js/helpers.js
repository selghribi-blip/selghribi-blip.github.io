// مساعدات اختبار main.js | Test helpers for main.js
import { vi } from 'vitest';

const MAIN_PATH = '../../assets/js/main.js';

let loadCounter = 0;

// المستمعون المسجَّلون على document/window ليتم إزالتهم بين الاختبارات
// Listeners registered on document/window, tracked so they can be removed between tests.
const trackedListeners = [];

function trackTarget(target) {
  const original = target.addEventListener.bind(target);
  target.addEventListener = (type, listener, options) => {
    trackedListeners.push({ target, type, listener, options });
    original(type, listener, options);
  };
}

/**
 * تتبّع المستمعين العالميين | Start tracking global listeners (call once per file).
 */
export function trackGlobalListeners() {
  trackTarget(document);
  trackTarget(window);
}

/**
 * إزالة المستمعين وتصفير DOM | Remove tracked listeners and clear the DOM.
 */
export function resetGlobals() {
  while (trackedListeners.length) {
    const { target, type, listener, options } = trackedListeners.pop();
    target.removeEventListener(type, listener, options);
  }
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('dir');
  localStorage.clear();
}

/**
 * مراقبو التقاطع المُنشأون | IntersectionObserver instances created by the module.
 */
export const observers = [];

/**
 * تثبيت IntersectionObserver | Install a controllable IntersectionObserver stub.
 */
export function stubIntersectionObserver() {
  observers.length = 0;

  class FakeIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = [];
      this.unobserved = [];
      observers.push(this);
    }

    observe(el) {
      this.observed.push(el);
    }

    unobserve(el) {
      this.unobserved.push(el);
    }

    disconnect() {}

    /** إطلاق التقاطع | Trigger intersection for the given elements. */
    trigger(elements, isIntersecting = true) {
      const targets = elements ?? this.observed;
      this.callback(
        targets.map((target) => ({ target, isIntersecting })),
        this
      );
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
}

/**
 * تثبيت الحافظة | Install a clipboard stub, returning the writeText mock.
 */
export function stubClipboard(impl) {
  const writeText = vi.fn(impl ?? (() => Promise.resolve()));
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  return writeText;
}

/**
 * ضبط موضع التمرير | Set the window scroll position.
 */
export function setScrollY(value) {
  Object.defineProperty(window, 'scrollY', { value, configurable: true, writable: true });
}

/**
 * ضبط عرض النافذة | Set the window inner width.
 */
export function setInnerWidth(value) {
  Object.defineProperty(window, 'innerWidth', { value, configurable: true, writable: true });
}

/**
 * ضبط أبعاد التمرير للمستند | Fake document scroll metrics.
 */
export function setDocumentScroll({ scrollTop = 0, scrollHeight = 0, clientHeight = 0 }) {
  const doc = document.documentElement;
  Object.defineProperty(doc, 'scrollTop', { value: scrollTop, configurable: true, writable: true });
  Object.defineProperty(doc, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(doc, 'clientHeight', {
    value: clientHeight,
    configurable: true,
    writable: true,
  });
}

/**
 * إطلاق حدث على الهدف | Dispatch a simple event on a target.
 */
export function fire(target, type) {
  target.dispatchEvent(new window.Event(type));
}

/**
 * تحميل main.js مع DOM معطى | Load main.js against the given markup.
 *
 * يُعاد تنفيذ الملف في كل مرة (باستعلام لتجاوز الذاكرة المؤقتة) ثم يُطلق DOMContentLoaded.
 * Re-evaluates the file (cache-busted) and then fires DOMContentLoaded.
 */
export async function loadMain(html = '', { fireReady = true } = {}) {
  document.body.innerHTML = html;
  await import(/* @vite-ignore */ `${MAIN_PATH}?load=${loadCounter++}`);
  if (fireReady) {
    fire(document, 'DOMContentLoaded');
  }
}
