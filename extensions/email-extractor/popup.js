/**
 * popup.js
 * Handles all popup UI interactions:
 *  - Scan page / Scan selection
 *  - Copy all
 *  - Download CSV / Download JSON
 *  - Filter list
 *  - Clear
 *  - Dark / Light theme toggle
 */

// ─── State ────────────────────────────────────────────────────────────────────
let emails = [];
let pageUrl = "";

// ─── Element references ───────────────────────────────────────────────────────
const els = {
  statusBadge:      document.getElementById("statusBadge"),
  includeMailto:    document.getElementById("includeMailto"),
  scanPageBtn:      document.getElementById("scanPageBtn"),
  scanSelectionBtn: document.getElementById("scanSelectionBtn"),
  copyBtn:          document.getElementById("copyBtn"),
  downloadCsvBtn:   document.getElementById("downloadCsvBtn"),
  downloadJsonBtn:  document.getElementById("downloadJsonBtn"),
  clearBtn:         document.getElementById("clearBtn"),
  count:            document.getElementById("count"),
  list:             document.getElementById("list"),
  note:             document.getElementById("note"),
  filterInput:      document.getElementById("filterInput"),
  themeBtn:         document.getElementById("themeBtn"),
  iconDark:         document.getElementById("iconDark"),
  iconLight:        document.getElementById("iconLight")
};

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  if (isDark) {
    document.body.classList.replace("bg-white", "bg-slate-950");
    document.body.classList.replace("text-slate-900", "text-slate-100");
    els.iconDark.classList.remove("hidden");
    els.iconLight.classList.add("hidden");
  } else {
    document.body.classList.replace("bg-slate-950", "bg-white");
    document.body.classList.replace("text-slate-100", "text-slate-900");
    els.iconDark.classList.add("hidden");
    els.iconLight.classList.remove("hidden");
  }
}

let isDark = true;
els.themeBtn.addEventListener("click", () => {
  isDark = !isDark;
  applyTheme(isDark);
  try { localStorage.setItem("emailExtTheme", isDark ? "dark" : "light"); } catch (_) {}
});

// Restore persisted theme preference
try {
  const saved = localStorage.getItem("emailExtTheme");
  if (saved) {
    isDark = saved === "dark";
    applyTheme(isDark);
  }
} catch (_) {}

// ─── Status badge ─────────────────────────────────────────────────────────────
function setStatus(text, variant = "idle") {
  els.statusBadge.textContent = text;
  const base = "text-xs px-2 py-1 rounded-full border whitespace-nowrap";
  const variants = {
    idle:    "bg-slate-800 text-slate-200 border-slate-700",
    loading: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    success: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    error:   "bg-rose-500/15 text-rose-200 border-rose-500/30",
    info:    "bg-blue-500/15 text-blue-200 border-blue-500/30"
  };
  els.statusBadge.className = `${base} ${variants[variant] || variants.idle}`;
}

// ─── Results list ─────────────────────────────────────────────────────────────
function setActionButtonsEnabled(enabled) {
  els.copyBtn.disabled = !enabled;
  els.downloadCsvBtn.disabled = !enabled;
  els.downloadJsonBtn.disabled = !enabled;
}

function renderList() {
  const filter = (els.filterInput.value || "").trim().toLowerCase();
  const visible = filter ? emails.filter((e) => e.includes(filter)) : emails;

  els.list.innerHTML = "";
  for (const email of visible) {
    const li = document.createElement("li");
    li.className =
      "px-3 py-2 text-sm text-slate-200 flex items-center justify-between gap-2";

    const span = document.createElement("span");
    span.textContent = email;
    span.className = "truncate";

    const btn = document.createElement("button");
    btn.textContent = "Copy";
    btn.className =
      "shrink-0 text-xs px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800";
    btn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(email);
      els.note.textContent = `Copied: ${email}`;
    });

    li.appendChild(span);
    li.appendChild(btn);
    els.list.appendChild(li);
  }

  els.count.textContent = String(emails.length);
  setActionButtonsEnabled(emails.length > 0);
}

// ─── Scan helpers ─────────────────────────────────────────────────────────────
function setScanButtonsDisabled(disabled) {
  els.scanPageBtn.disabled = disabled;
  els.scanSelectionBtn.disabled = disabled;
}

async function scan(source) {
  setStatus("Scanning…", "loading");
  els.note.textContent = "";
  setScanButtonsDisabled(true);

  try {
    const res = await chrome.runtime.sendMessage({
      type: "SCAN_PAGE",
      source,                                        // "page" | "selection"
      options: { includeMailto: els.includeMailto.checked }
    });

    if (!res?.ok) throw new Error(res?.error || "Scan failed.");

    // Content script signals an empty selection
    if (res.data?.emptySelection) {
      setStatus("Info", "info");
      els.note.textContent =
        "No text is selected on the page. Highlight text first, then click "Scan selection".";
      // Do NOT overwrite existing results
      return;
    }

    emails  = res.data?.emails  || [];
    pageUrl = res.data?.pageUrl || "";

    if (emails.length === 0) {
      setStatus("Done", "success");
      els.note.textContent =
        source === "selection"
          ? "No emails found in the selected text."
          : "No emails found on this page.";
    } else {
      setStatus("Done", "success");
      els.note.textContent =
        `Found ${emails.length} email${emails.length === 1 ? "" : "s"}` +
        (source === "selection" ? " in selection." : ".");
    }

    renderList();
  } catch (err) {
    setStatus("Error", "error");
    els.note.textContent = err?.message || "Unexpected error.";
    emails  = [];
    pageUrl = "";
    renderList();
  } finally {
    setScanButtonsDisabled(false);
  }
}

// ─── Export helpers ───────────────────────────────────────────────────────────
function toCsv(arr) {
  const header = "email\n";
  const rows = arr.map((e) => `"${e.replaceAll('"', '""')}"`).join("\n");
  return header + rows + "\n";
}

function toJson(arr) {
  return JSON.stringify({ emails: arr }, null, 2) + "\n";
}

function safeDomainFromUrl(url) {
  try {
    const u = new URL(url);
    return (u.hostname || "page").replaceAll(".", "_");
  } catch (_) {
    return "page";
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function downloadBlob(content, mimeType, filename) {
  const blobUrl = URL.createObjectURL(
    new Blob([content], { type: mimeType })
  );
  chrome.downloads.download({ url: blobUrl, filename, saveAs: true });
  els.note.textContent = `Downloading: ${filename}`;
}

// ─── Event listeners ──────────────────────────────────────────────────────────
els.scanPageBtn.addEventListener("click",      () => scan("page"));
els.scanSelectionBtn.addEventListener("click", () => scan("selection"));

els.copyBtn.addEventListener("click", async () => {
  if (!emails.length) return;
  await navigator.clipboard.writeText(emails.join("\n"));
  els.note.textContent = `Copied ${emails.length} email${emails.length === 1 ? "" : "s"}.`;
});

els.downloadCsvBtn.addEventListener("click", () => {
  if (!emails.length) return;
  const name = `emails_${safeDomainFromUrl(pageUrl)}_${timestamp()}.csv`;
  downloadBlob(toCsv(emails), "text/csv;charset=utf-8", name);
});

els.downloadJsonBtn.addEventListener("click", () => {
  if (!emails.length) return;
  const name = `emails_${safeDomainFromUrl(pageUrl)}_${timestamp()}.json`;
  downloadBlob(toJson(emails), "application/json;charset=utf-8", name);
});

els.clearBtn.addEventListener("click", () => {
  emails  = [];
  pageUrl = "";
  els.filterInput.value = "";
  els.note.textContent  = "Cleared.";
  setStatus("Idle", "idle");
  renderList();
});

els.filterInput.addEventListener("input", renderList);

// ─── Init ─────────────────────────────────────────────────────────────────────
renderList();
setStatus("Idle", "idle");
