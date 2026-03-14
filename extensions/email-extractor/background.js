/**
 * Background Service Worker (MV3)
 * - Injects the content script on demand
 * - Asks it to scan the page
 * - Returns results to popup
 */

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found.");
  return tab;
}

/**
 * Inject content script into the active tab.
 * We do it programmatically to avoid always-on injection.
 */
async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // We will respond async
  (async () => {
    try {
      if (msg?.type === "SCAN_PAGE") {
        const tab = await getActiveTab();
        await ensureContentScript(tab.id);

        // Ask content script to scan
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: "EXTRACT_EMAILS",
          options: msg.options || {}
        });

        // Attach basic page info
        sendResponse({
          ok: true,
          data: {
            emails: response?.emails || [],
            pageUrl: tab.url || "",
            pageTitle: tab.title || ""
          }
        });
        return;
      }

      sendResponse({ ok: false, error: "Unknown message type." });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || "Unexpected error." });
    }
  })();

  return true; // keep the message channel open for async response
});
