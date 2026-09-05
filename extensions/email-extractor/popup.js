let emails = [];
let pageUrl = "";

const els = {
  statusBadge: document.getElementById("statusBadge"),
  includeMailto: document.getElementById("includeMailto"),
  scanBtn: document.getElementById("scanBtn"),
  copyBtn: document.getElementById("copyBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  clearBtn: document.getElementById("clearBtn"),
  count: document.getElementById("count"),
  list: document.getElementById("list"),
  note: document.getElementById("note"),
  filterInput: document.getElementById("filterInput")
};

function setStatus(text, variant = "idle") {
  els.statusBadge.textContent = text;

  const base = "text-xs px-2 py-1 rounded-full border";
  const variants = {
    idle: "bg-slate-800 text-slate-200 border-slate-700",
    loading: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    success: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    error: "bg-rose-500/15 text-rose-200 border-rose-500/30"
  };

  els.statusBadge.className = `${base} ${variants[variant] || variants.idle}`;
}

function setButtonsEnabled(enabled) {
  els.copyBtn.disabled = !enabled;
  els.downloadBtn.disabled = !enabled;
}

function renderList() {
  const filter = (els.filterInput.value || "").trim().toLowerCase();
  const visible = filter
    ? emails.filter((e) => e.includes(filter))
    : emails;

  els.list.innerHTML = "";
  for (const email of visible) {
    const li = document.createElement("li");
    li.className = "px-3 py-2 text-sm text-slate-200 flex items-center justify-between gap-2";

    const span = document.createElement("span");
    span.textContent = email;
    span.className = "truncate";

    const btn = document.createElement("button");
    btn.textContent = "Copy";
    btn.className = "shrink-0 text-xs px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800";
    btn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(email);
      els.note.textContent = `Copied: ${email}`;
    });

    li.appendChild(span);
    li.appendChild(btn);
    els.list.appendChild(li);
  }

  els.count.textContent = String(emails.length);
  setButtonsEnabled(emails.length > 0);
}

function toCsv(emailsArr) {
  const header = "email\n";
  // Strip any control characters that could break CSV format
  const rows = emailsArr
    .map((e) => e.replace(/[\r\n,]/g, ""))
    .map((e) => `"${e.replaceAll('"', '""')}"`)
    .join("\n");
  return header + rows + "\n";
}

function safeDomainFromUrl(url) {
  try {
    const u = new URL(url);
    return (u.hostname || "page").replaceAll(".", "_");
  } catch {
    return "page";
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

async function scanPage() {
  setStatus("Scanning...", "loading");
  els.note.textContent = "";
  els.scanBtn.disabled = true;

  try {
    const res = await chrome.runtime.sendMessage({
      type: "SCAN_PAGE",
      options: { includeMailto: els.includeMailto.checked }
    });

    if (!res?.ok) throw new Error(res?.error || "Scan failed.");

    emails = res.data.emails || [];
    pageUrl = res.data.pageUrl || "";

    setStatus("Done", "success");
    els.note.textContent = emails.length
      ? "Scan completed."
      : "No emails found on this page.";

    renderList();
  } catch (err) {
    setStatus("Error", "error");
    els.note.textContent = err?.message || "Unexpected error.";
    emails = [];
    pageUrl = "";
    renderList();
  } finally {
    els.scanBtn.disabled = false;
  }
}

async function copyAll() {
  if (!emails.length) return;
  await navigator.clipboard.writeText(emails.join("\n"));
  els.note.textContent = `Copied ${emails.length} emails.`;
}

async function downloadCsv() {
  if (!emails.length) return;

  const csv = toCsv(emails);
  const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));

  const filename = `emails_${safeDomainFromUrl(pageUrl)}_${timestamp()}.csv`;

  chrome.downloads.download({
    url: blobUrl,
    filename,
    saveAs: true
  });

  els.note.textContent = `Downloading: ${filename}`;
}

function clearAll() {
  emails = [];
  pageUrl = "";
  els.filterInput.value = "";
  els.note.textContent = "Cleared.";
  setStatus("Idle", "idle");
  renderList();
}

els.scanBtn.addEventListener("click", scanPage);
els.copyBtn.addEventListener("click", copyAll);
els.downloadBtn.addEventListener("click", downloadCsv);
els.clearBtn.addEventListener("click", clearAll);
els.filterInput.addEventListener("input", renderList);

// Initial render
renderList();
setStatus("Idle", "idle");
