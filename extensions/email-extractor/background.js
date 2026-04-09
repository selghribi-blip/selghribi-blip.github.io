/**
 * Background Service Worker (MV3)
 * - Injects the content script on demand
 * - Forwards scan mode ("page" | "selection") to content script
 * - Returns results to popup
 */

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found.");
  return tab;
}

/**
 * Inject content script into the active tab programmatically.
 * chrome.scripting.executeScript is idempotent enough for our use-case;
 * if the script is already injected the listener registration is harmless
 * because the existing listener simply processes the next message.
 */
async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "SCAN_PAGE") {
        const tab = await getActiveTab();
        await ensureContentScript(tab.id);

        const response = await chrome.tabs.sendMessage(tab.id, {
          type: "EXTRACT_EMAILS",
          source: msg.source || "page",   // "page" | "selection"
          options: msg.options || {}
        });

        sendResponse({
          ok: true,
          data: {
            emails: response?.emails || [],
            emptySelection: response?.emptySelection || false,
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

  return true; // keep the channel open for async response
});
