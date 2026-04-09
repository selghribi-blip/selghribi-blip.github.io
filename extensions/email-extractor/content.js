/**
 * Content Script
 * Scans the visible page text and mailto links to extract unique email addresses.
 * Responds to EXTRACT_EMAILS messages from the background service worker.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/** Well-known generic prefixes that are often noise for lead-gen use-cases. */
const DEFAULT_GENERIC_PREFIXES = [
  'info', 'support', 'sales', 'contact', 'help', 'admin', 'noreply',
  'no-reply', 'hello', 'team', 'billing', 'abuse', 'legal', 'privacy',
  'webmaster', 'postmaster', 'mailer-daemon', 'careers', 'jobs',
  'newsletter', 'unsubscribe'
];

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isProbablyValidEmail(email) {
  if (!email.includes('@')) return false;
  if (email.length < 6) return false;
  if (email.endsWith('@')) return false;
  if (email.includes('..')) return false;

  // Skip well-known placeholder domains
  const badDomains = ['example.com', 'email.com', 'domain.com', 'yourdomain.com', 'test.com'];
  const domain = email.split('@')[1] || '';
  if (badDomains.includes(domain)) return false;

  return true;
}

function isGenericEmail(email, prefixes) {
  const local = email.split('@')[0] || '';
  return prefixes.some((p) => local === p || local.startsWith(p + '.'));
}

function extractEmailsFromText(text) {
  return text.match(EMAIL_REGEX) || [];
}

function getPageText() {
  return document.body ? document.body.innerText : '';
}

function getMailtoEmails() {
  return Array.from(document.querySelectorAll('a[href^="mailto:"]')).map((a) => {
    const href = a.getAttribute('href') || '';
    return href.replace(/^mailto:/i, '').split('?')[0];
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'EXTRACT_EMAILS') return;

  const options = msg.options || {};
  const includeMailto = options.includeMailto !== false;
  const ignoreGenerics = Boolean(options.ignoreGenerics);
  const genericPrefixes = Array.isArray(options.genericPrefixes)
    ? options.genericPrefixes
    : DEFAULT_GENERIC_PREFIXES;

  const textEmails = extractEmailsFromText(getPageText());
  const mailtoEmails = includeMailto ? getMailtoEmails() : [];

  let all = [...textEmails, ...mailtoEmails]
    .map(normalizeEmail)
    .filter(isProbablyValidEmail);

  if (ignoreGenerics) {
    all = all.filter((e) => !isGenericEmail(e, genericPrefixes));
  }

  const unique = Array.from(new Set(all)).sort();
  sendResponse({ emails: unique });
});
