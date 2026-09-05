/**
 * background.js — Service Worker (Manifest V3)
 *
 * Handles messages from the popup and coordinates script injection
 * into the active tab using the scripting API.
 */

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "extractEmails") {
    const options = {
      includeMailto: message.includeMailto !== false,
      filterFalsePositives: message.filterFalsePositives !== false,
    };
    handleExtraction(options, sendResponse);
    // Return true to keep the message channel open for the async response
    return true;
  }

  if (message.action === "downloadCSV") {
    handleDownload(message.csv, message.filename, sendResponse);
    return true;
  }
});

/**
 * Injects the content script into the active tab and requests email extraction.
 * @param {{ includeMailto: boolean, filterFalsePositives: boolean }} options
 * @param {Function} sendResponse - Callback to send results back to popup.
 */
async function handleExtraction(options, sendResponse) {
  try {
    // Get the currently active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      sendResponse({ success: false, error: "No active tab found." });
      return;
    }

    // Inject the content script dynamically
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    // Send a message to the now-injected content script, forwarding options
    chrome.tabs.sendMessage(tab.id, { action: "getEmails", ...options }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response);
      }
    });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Triggers a file download using the downloads API.
 * @param {string} csv - The CSV content as a string.
 * @param {string} filename - Desired filename for the download.
 * @param {Function} sendResponse - Callback to confirm download started.
 */
async function handleDownload(csv, filename, sendResponse) {
  try {
    // Convert CSV string to a Blob URL
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    await chrome.downloads.download({
      url,
      filename,
      saveAs: false,
    });

    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}
