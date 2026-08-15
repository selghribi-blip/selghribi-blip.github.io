// اختبارات نموذج النشرة | Newsletter form tests
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { loadMain, resetGlobals, stubIntersectionObserver, trackGlobalListeners } from './helpers.js';

const FORM = `
  <form class="newsletter-form"${'{{ACTION}}'}>
    <input type="email" name="email" value="" />
    <button type="submit" data-original-text="اشترك">اشترك</button>
  </form>
`;

function formHtml({ action } = {}) {
  return FORM.replace('{{ACTION}}', action ? ` action="${action}"` : '');
}

function submit(form) {
  const event = new window.Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(event);
  return event;
}

/** انتظار انتهاء المهام المعلقة | Flush pending microtasks. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

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

describe('handleNewsletterSubmit', () => {
  it('prevents the default submission', async () => {
    await loadMain(formHtml());
    const event = submit(document.querySelector('.newsletter-form'));
    expect(event.defaultPrevented).toBe(true);
  });

  it('rejects an invalid email without submitting', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await loadMain(formHtml({ action: 'https://example.test/subscribe' }));

    const form = document.querySelector('.newsletter-form');
    form.querySelector('input[type="email"]').value = 'not-an-email';
    submit(form);
    await flush();

    const message = form.querySelector('.form-message');
    expect(message.className).toContain('alert-error');
    expect(message.textContent).toContain('بريد إلكتروني صحيح');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(form.querySelector('button[type="submit"]').disabled).toBe(false);
  });

  it.each(['user@example', 'user example@test.com', 'user@@example.com', ''])(
    'treats %j as invalid',
    async (value) => {
      await loadMain(formHtml());
      const form = document.querySelector('.newsletter-form');
      form.querySelector('input[type="email"]').value = value;
      submit(form);
      await flush();

      expect(form.querySelector('.form-message').className).toContain('alert-error');
    }
  );

  it('posts the email as JSON and shows success', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await loadMain(formHtml({ action: 'https://example.test/subscribe' }));

    const form = document.querySelector('.newsletter-form');
    const input = form.querySelector('input[type="email"]');
    input.value = '  reader@example.com  ';
    submit(form);
    await flush();

    expect(fetchMock).toHaveBeenCalledWith('https://example.test/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reader@example.com' }),
    });
    expect(form.querySelector('.form-message').className).toContain('alert-success');
    expect(input.value).toBe('');
  });

  it('shows an error when the service responds with a failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false })));
    await loadMain(formHtml({ action: 'https://example.test/subscribe' }));

    const form = document.querySelector('.newsletter-form');
    form.querySelector('input[type="email"]').value = 'reader@example.com';
    submit(form);
    await flush();

    expect(form.querySelector('.form-message').className).toContain('alert-error');
    expect(form.querySelector('input[type="email"]').value).toBe('reader@example.com');
  });

  it('shows an error when the request rejects', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    await loadMain(formHtml({ action: 'https://example.test/subscribe' }));

    const form = document.querySelector('.newsletter-form');
    form.querySelector('input[type="email"]').value = 'reader@example.com';
    submit(form);
    await flush();

    expect(form.querySelector('.form-message').className).toContain('alert-error');
  });

  it('succeeds in demo mode when the form has no action', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await loadMain(formHtml());

    const form = document.querySelector('.newsletter-form');
    form.querySelector('input[type="email"]').value = 'reader@example.com';
    submit(form);
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(form.querySelector('.form-message').className).toContain('alert-success');
  });

  it('restores the submit button after the request finishes', async () => {
    let resolveFetch;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; }))
    );
    await loadMain(formHtml({ action: 'https://example.test/subscribe' }));

    const form = document.querySelector('.newsletter-form');
    const button = form.querySelector('button[type="submit"]');
    form.querySelector('input[type="email"]').value = 'reader@example.com';
    submit(form);

    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('...');

    resolveFetch({ ok: true });
    await flush();

    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe('اشترك');
  });

  it('falls back to the default button label without data-original-text', async () => {
    await loadMain(`
      <form id="newsletter-form">
        <input type="email" value="reader@example.com" />
        <button type="submit">Subscribe</button>
      </form>
    `);

    const form = document.getElementById('newsletter-form');
    submit(form);
    await flush();

    expect(form.querySelector('button[type="submit"]').textContent).toBe('اشترك');
  });

  it('ignores forms without an email input', async () => {
    await loadMain('<form class="newsletter-form"><button type="submit">go</button></form>');

    const form = document.querySelector('.newsletter-form');
    submit(form);
    await flush();

    expect(form.querySelector('.form-message')).toBeNull();
  });

  it('works without a submit button', async () => {
    await loadMain(
      '<form class="newsletter-form"><input type="email" value="reader@example.com" /></form>'
    );

    const form = document.querySelector('.newsletter-form');
    submit(form);
    await flush();

    expect(form.querySelector('.form-message').className).toContain('alert-success');
  });
});

describe('showFormMessage', () => {
  it('reuses an existing message element and styles it', async () => {
    await loadMain(`
      <form class="newsletter-form">
        <input type="email" value="reader@example.com" />
        <p class="form-message">old</p>
      </form>
    `);

    const form = document.querySelector('.newsletter-form');
    const existing = form.querySelector('.form-message');
    submit(form);
    await flush();

    expect(form.querySelectorAll('.form-message')).toHaveLength(1);
    expect(existing.textContent).toContain('تم الاشتراك');
    expect(existing.style.marginTop).toBe('12px');
  });

  it('removes success messages after five seconds but keeps errors', async () => {
    vi.useFakeTimers();
    await loadMain(formHtml());
    const form = document.querySelector('.newsletter-form');
    form.querySelector('input[type="email"]').value = 'reader@example.com';
    submit(form);
    await vi.advanceTimersByTimeAsync(0);

    expect(form.querySelector('.form-message')).not.toBeNull();
    await vi.advanceTimersByTimeAsync(5000);
    expect(form.querySelector('.form-message')).toBeNull();

    form.querySelector('input[type="email"]').value = 'bad';
    submit(form);
    await vi.advanceTimersByTimeAsync(5000);
    expect(form.querySelector('.form-message')).not.toBeNull();
  });
});
