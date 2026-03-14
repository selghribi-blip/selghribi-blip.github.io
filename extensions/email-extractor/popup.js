/**
 * popup.js — Popup UI Logic
 *
 * Handles user interactions in popup.html:
 *   - "Scan Page" → injects content script & collects emails
 *   - "Copy"      → copies all emails to clipboard
 *   - "Download CSV" → triggers CSV download via background worker
 *   - "Clear"     → resets the UI
 *
 * Communication flow:
 *   popup.js  →(chrome.runtime.sendMessage)→  background.js
 *   background.js  →(chrome.tabs.sendMessage)→  content.js
 *   content.js  →(sendResponse)→  background.js  →(sendResponse)→  popup.js
 */

"use strict";

// ─── DOM References ──────────────────────────────────────────────────────────
const btnScan       = document.getElementById("btnScan");
const btnScanLabel  = document.getElementById("btnScanLabel");
const btnScanSpinner = document.getElementById("btnScanSpinner");
const btnCopy       = document.getElementById("btnCopy");
const btnDownload   = document.getElementById("btnDownload");
const btnClear      = document.getElementById("btnClear");

const statusBadge   = document.getElementById("statusBadge");
const statusText    = document.getElementById("statusText");

const resultsPanel  = document.getElementById("resultsPanel");
const emailCount    = document.getElementById("emailCount");
const emailList     = document.getElementById("emailList");
const emptyState    = document.getElementById("emptyState");

const errorMsg      = document.getElementById("errorMsg");
const errorText     = document.getElementById("errorText");

const toast         = document.getElementById("toast");

const includeMailtoCheckbox       = document.getElementById("includeMailto");
const filterFalsePositivesCheckbox = document.getElementById("filterFalsePositives");

// ─── State ────────────────────────────────────────────────────────────────────
/** @type {string[]} */
let currentEmails = [];

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS = {
  idle:     { label: "Idle",     cls: "status-idle" },
  scanning: { label: "Scanning", cls: "status-scanning" },
  done:     { label: "Done",     cls: "status-done" },
  error:    { label: "Error",    cls: "status-error" },
};

/**
 * Update the status badge in the header.
 * @param {"idle"|"scanning"|"done"|"error"} state
 */
function setStatus(state) {
  const s = STATUS[state] || STATUS.idle;
  statusBadge.className = `status-badge ${s.cls}`;
  statusText.textContent = s.label;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer = null;

/**
 * Show a brief toast notification.
 * @param {string} message
 */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}

// ─── Error display ────────────────────────────────────────────────────────────
/**
 * Show or hide the error panel.
 * @param {string|null} message - Pass null to hide.
 */
function showError(message) {
  if (message) {
    errorText.textContent = message;
    errorMsg.classList.remove("hidden");
  } else {
    errorMsg.classList.add("hidden");
    errorText.textContent = "";
  }
}

// ─── Scan ─────────────────────────────────────────────────────────────────────
/**
 * Set scan button into loading state.
 * @param {boolean} loading
 */
function setScanLoading(loading) {
  if (loading) {
    btnScan.disabled = true;
    btnScanLabel.textContent = "Scanning…";
    btnScanSpinner.classList.remove("hidden");
  } else {
    btnScan.disabled = false;
    btnScanLabel.textContent = "Scan Page";
    btnScanSpinner.classList.add("hidden");
  }
}

/**
 * Triggered when user clicks "Scan Page".
 * Sends a message to the background worker which injects the content script
 * and returns the extracted email list.
 */
async function handleScan() {
  showError(null);
  setStatus("scanning");
  setScanLoading(true);

  // Read options from checkboxes and pass them through to the content script
  const includeMailto        = includeMailtoCheckbox.checked;
  const filterFalsePositives = filterFalsePositivesCheckbox.checked;

  chrome.runtime.sendMessage(
    { action: "extractEmails", includeMailto, filterFalsePositives },
    (response) => {
      setScanLoading(false);

      if (chrome.runtime.lastError) {
        setStatus("error");
        showError(chrome.runtime.lastError.message);
        return;
      }

      if (!response || !response.success) {
        setStatus("error");
        showError(response?.error || "Unknown error occurred.");
        return;
      }

      currentEmails = response.emails || [];
      setStatus("done");
      renderResults(currentEmails);
    }
  );
}

// ─── Render ───────────────────────────────────────────────────────────────────
/**
 * Render the email list into the popup.
 * @param {string[]} emails
 */
function renderResults(emails) {
  // Show the results panel
  resultsPanel.classList.remove("hidden");
  resultsPanel.classList.add("flex");

  // Update count
  emailCount.textContent = emails.length;

  // Enable/disable action buttons
  const hasEmails = emails.length > 0;
  btnCopy.disabled = !hasEmails;
  btnDownload.disabled = !hasEmails;

  // Clear previous list
  emailList.innerHTML = "";

  if (!hasEmails) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  // Build list items
  emails.forEach((email) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.className = "email-text";
    span.textContent = email;
    span.title = email;

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-one";
    copyBtn.textContent = "Copy";
    copyBtn.title = `Copy ${email}`;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(email).then(() => showToast("Copied!"));
    });

    li.appendChild(span);
    li.appendChild(copyBtn);
    emailList.appendChild(li);
  });
}

// ─── Copy all ─────────────────────────────────────────────────────────────────
/**
 * Copy all extracted emails to clipboard, one per line.
 */
function handleCopyAll() {
  if (!currentEmails.length) return;
  navigator.clipboard.writeText(currentEmails.join("\n")).then(() => {
    showToast(`Copied ${currentEmails.length} email(s) to clipboard!`);
  });
}

// ─── Download CSV ─────────────────────────────────────────────────────────────
/**
 * Build a CSV string and trigger a download via the background service worker.
 * Filename format: emails_<domain>_<YYYYMMDD_HHmmss>.csv
 */
async function handleDownloadCSV() {
  if (!currentEmails.length) return;

  // Build CSV content with header row
  const header = "email";
  const rows = currentEmails.map((e) => `"${e.replace(/"/g, '""')}"`);
  const csvContent = [header, ...rows].join("\r\n");

  // Generate filename using current tab domain + timestamp
  let domain = "page";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      domain = new URL(tab.url).hostname.replace(/^www\./, "") || "page";
      // Sanitise: keep only alphanumeric, dots, and hyphens
      domain = domain.replace(/[^a-zA-Z0-9.-]/g, "_");
    }
  } catch (_) {
    // Fallback to generic name
  }

  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "_",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const filename = `emails_${domain}_${ts}.csv`;

  // Ask background worker to trigger the download (it has the downloads API)
  chrome.runtime.sendMessage(
    { action: "downloadCSV", csv: csvContent, filename },
    (response) => {
      if (response?.success) {
        showToast("CSV download started!");
      } else {
        showError(response?.error || "Download failed.");
      }
    }
  );
}

// ─── Clear ────────────────────────────────────────────────────────────────────
/**
 * Reset the UI to its initial state.
 */
function handleClear() {
  currentEmails = [];
  emailList.innerHTML = "";
  emailCount.textContent = "0";
  btnCopy.disabled = true;
  btnDownload.disabled = true;
  resultsPanel.classList.add("hidden");
  resultsPanel.classList.remove("flex");
  emptyState.classList.add("hidden");
  showError(null);
  setStatus("idle");
}

// ─── Event listeners ──────────────────────────────────────────────────────────
btnScan.addEventListener("click", handleScan);
btnCopy.addEventListener("click", handleCopyAll);
btnDownload.addEventListener("click", handleDownloadCSV);
btnClear.addEventListener("click", handleClear);
