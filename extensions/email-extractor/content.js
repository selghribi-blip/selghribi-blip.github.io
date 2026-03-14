/**
 * content.js — Content Script
 *
 * Runs in the context of the active web page.
 * Extracts all unique email addresses from visible text and mailto: links,
 * then returns them to the background service worker on request.
 */

/**
 * Regex to match email addresses.
 * Covers most standard formats including subdomains and plus-addressing.
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/**
 * Domains commonly used as examples / placeholders — filtered out by default.
 */
const FALSE_POSITIVE_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "domain.com",
  "yourdomain.com",
  "email.com",
]);

/**
 * File extension-like TLDs that indicate a code reference rather than a real email
 * (e.g. asset@2x.png, bundle@module.js).
 */
const CODE_TLDS = new Set([
  "js", "ts", "css", "png", "jpg", "gif", "svg", "min", "map", "json",
]);

/**
 * Extract all email addresses from a text string.
 * @param {string} text
 * @returns {string[]}
 */
function extractFromText(text) {
  return text.match(EMAIL_REGEX) || [];
}

/**
 * Collect email addresses from mailto: links in the DOM.
 * @returns {string[]}
 */
function extractFromMailtoLinks() {
  const anchors = document.querySelectorAll('a[href^="mailto:"]');
  const emails = [];
  anchors.forEach((a) => {
    // href may be "mailto:user@example.com?subject=Hello" — strip query string
    const raw = a.href.replace(/^mailto:/i, "").split("?")[0].trim();
    // A single mailto: can contain multiple addresses separated by commas
    raw.split(",").forEach((e) => {
      const trimmed = e.trim().toLowerCase();
      if (trimmed) emails.push(trimmed);
    });
  });
  return emails;
}

/**
 * Filter obvious false positives from the extracted email list.
 * @param {string} email
 * @returns {boolean} true if the email should be kept
 */
function isRealEmail(email) {
  const domain = email.split("@")[1] || "";
  if (FALSE_POSITIVE_DOMAINS.has(domain.toLowerCase())) return false;
  // Skip emails whose TLD looks like a file extension (e.g. asset@bundle.js)
  const tld = domain.split(".").pop().toLowerCase();
  if (CODE_TLDS.has(tld)) return false;
  return true;
}

/**
 * Main extraction function.
 * Walks page text + mailto links, deduplicates, normalises to lower-case,
 * applies false-positive filter, and returns a sorted array.
 * @param {{ includeMailto: boolean, filterFalsePositives: boolean }} options
 * @returns {{ emails: string[], count: number }}
 */
function extractEmails({ includeMailto = true, filterFalsePositives = true } = {}) {
  // 1. Get all visible text from the page body
  const bodyText = document.body ? document.body.innerText : "";

  // 2. Also scan the raw HTML (catches emails inside attribute values / comments)
  const htmlText = document.documentElement.outerHTML;

  // 3. Collect from mailto: links (most reliable source)
  const mailtoEmails = includeMailto ? extractFromMailtoLinks() : [];

  // 4. Merge all sources
  const rawEmails = [
    ...extractFromText(bodyText),
    ...extractFromText(htmlText),
    ...mailtoEmails,
  ];

  // 5. Normalise to lower-case and deduplicate
  let unique = [...new Set(rawEmails.map((e) => e.toLowerCase().trim()))];

  // 6. Optionally filter false positives
  if (filterFalsePositives) {
    unique = unique.filter(isRealEmail);
  }

  // 7. Sort alphabetically for consistent output
  unique.sort();

  return { emails: unique, count: unique.length };
}

// Listen for messages from the background service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "getEmails") {
    try {
      const options = {
        includeMailto: message.includeMailto !== false,
        filterFalsePositives: message.filterFalsePositives !== false,
      };
      const result = extractEmails(options);
      sendResponse({ success: true, ...result });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  // Return true to signal async response if needed
  return true;
});
