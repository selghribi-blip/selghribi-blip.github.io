/**
 * Content Script
 * Handles {type:"EXTRACT_EMAILS", source:"page"|"selection", options:{...}}
 *
 * source === "page"      → scans full page text + optional mailto links
 * source === "selection" → scans only the user's current text selection
 */

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/** Filter out obvious false-positives / placeholder addresses. */
function isProbablyValidEmail(email) {
  if (!email.includes("@")) return false;
  if (email.length < 6) return false;
  if (email.endsWith("@")) return false;
  if (email.includes("..")) return false;

  const genericDomains = [
    "example.com", "email.com", "domain.com", "yourdomain.com",
    "test.com", "sample.com"
  ];
  const domain = email.split("@")[1] || "";
  if (genericDomains.includes(domain)) return false;

  return true;
}

/** Extract emails from an arbitrary string. */
function extractEmailsFromText(text) {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(regex) || [];
}

/** Collect mailto: href values from the DOM. */
function getMailtoEmails() {
  return Array.from(document.querySelectorAll('a[href^="mailto:"]'))
    .map((a) => {
      const href = a.getAttribute("href") || "";
      return href.replace(/^mailto:/i, "").split("?")[0];
    })
    .filter(Boolean);
}

// Guard: register the listener only once per content-script lifecycle.
if (!window.__emailExtractorRegistered) {
  window.__emailExtractorRegistered = true;

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== "EXTRACT_EMAILS") return;

    const source = msg.source || "page";         // "page" | "selection"
    const options = msg.options || {};
    const includeMailto = Boolean(options.includeMailto ?? true);

    let rawEmails = [];

    if (source === "selection") {
      const selectionText = window.getSelection()?.toString() || "";

      if (!selectionText.trim()) {
        sendResponse({ emails: null, emptySelection: true });
        return;
      }

      rawEmails = extractEmailsFromText(selectionText);
    } else {
      // Full-page scan
      const pageText = document.body ? document.body.innerText : "";
      rawEmails = extractEmailsFromText(pageText);

      if (includeMailto) {
        rawEmails = rawEmails.concat(getMailtoEmails());
      }
    }

    const unique = Array.from(
      new Set(rawEmails.map(normalizeEmail).filter(isProbablyValidEmail))
    ).sort();

    sendResponse({ emails: unique });
  });
}
