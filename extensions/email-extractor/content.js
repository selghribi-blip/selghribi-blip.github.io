/**
 * Content Script
 * - Scans visible text + mailto links (optional)
 * - Extracts unique emails
 */

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/**
 * Basic false-positive filters.
 */
function isProbablyValidEmail(email) {
  if (!email.includes("@")) return false;
  if (email.length < 6) return false;
  if (email.endsWith("@")) return false;
  if (email.includes("..")) return false;

  // Avoid common placeholder domains
  const bad = ["example.com", "email.com", "domain.com", "yourdomain.com"];
  const domain = email.split("@")[1] || "";
  if (bad.includes(domain)) return false;

  return true;
}

/**
 * Extract emails from a string using regex.
 */
function extractEmailsFromText(text) {
  // Prevent consecutive dots in both local and domain parts
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}/g;
  const matches = text.match(regex) || [];
  return matches;
}

function getPageText() {
  return document.body ? document.body.innerText : "";
}

function getMailtoEmails() {
  const links = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
  const emails = [];
  for (const a of links) {
    const href = a.getAttribute("href") || "";
    // mailto:test@example.com?subject=...
    const value = href.replace(/^mailto:/i, "").split("?")[0];
    if (value) emails.push(value);
  }
  return emails;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "EXTRACT_EMAILS") return;

  const options = msg.options || {};
  const includeMailto = Boolean(options.includeMailto ?? true);

  const textEmails = extractEmailsFromText(getPageText());
  const mailtoEmails = includeMailto ? getMailtoEmails() : [];

  const all = [...textEmails, ...mailtoEmails]
    .map(normalizeEmail)
    .filter(isProbablyValidEmail);

  const unique = Array.from(new Set(all)).sort();

  sendResponse({ emails: unique });
});
