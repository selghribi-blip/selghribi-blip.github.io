/**
 * Background Service Worker (MV3)
 * Injects the content script on demand and relays scan requests from the popup.
 */

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab found.');
  return tab;
}

/**
 * Inject content script programmatically so we only run it when requested.
 * executeScript is idempotent on re-injection for world: MAIN-less scripts.
 */
async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === 'SCAN_PAGE') {
        const tab = await getActiveTab();
        await ensureContentScript(tab.id);

        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'EXTRACT_EMAILS',
          options: msg.options || {}
        });

        sendResponse({
          ok: true,
          data: {
            emails: response?.emails || [],
            pageUrl: tab.url || '',
            pageTitle: tab.title || ''
          }
        });
        return;
      }

      sendResponse({ ok: false, error: 'Unknown message type.' });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || 'Unexpected error.' });
    }
  })();

  return true; // keep message channel open for async response
});
