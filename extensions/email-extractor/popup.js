/**
 * popup.js — Email Extractor MV3 popup script
 *
 * Features:
 *  - Dark/Light theme toggle (persisted via chrome.storage.local, defaults to system pref)
 *  - Scan page for emails
 *  - Filter results
 *  - Copy all / copy single
 *  - Download CSV
 *  - Download JSON (with metadata: pageUrl, pageTitle, extractedAt, emails[])
 *  - Ignore generic email prefixes (editable list, persisted)
 */

'use strict';

// ─── Default generic prefixes ──────────────────────────────────────────────
const DEFAULT_GENERIC_PREFIXES = [
  'info', 'support', 'sales', 'contact', 'help', 'admin', 'noreply',
  'no-reply', 'hello', 'team', 'billing', 'abuse', 'legal', 'privacy',
  'webmaster', 'postmaster', 'mailer-daemon', 'careers', 'jobs',
  'newsletter', 'unsubscribe'
].join(', ');

// ─── State ──────────────────────────────────────────────────────────────────
let emails = [];
let pageUrl = '';
let pageTitle = '';

// ─── Element refs ───────────────────────────────────────────────────────────
const els = {
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  statusBadge: document.getElementById('statusBadge'),
  includeMailto: document.getElementById('includeMailto'),
  ignoreGenerics: document.getElementById('ignoreGenerics'),
  genericsPrefixPanel: document.getElementById('genericsPrefixPanel'),
  genericPrefixes: document.getElementById('genericPrefixes'),
  savePrefixes: document.getElementById('savePrefixes'),
  scanBtn: document.getElementById('scanBtn'),
  copyBtn: document.getElementById('copyBtn'),
  downloadCsvBtn: document.getElementById('downloadCsvBtn'),
  downloadJsonBtn: document.getElementById('downloadJsonBtn'),
  clearBtn: document.getElementById('clearBtn'),
  count: document.getElementById('count'),
  list: document.getElementById('list'),
  note: document.getElementById('note'),
  filterInput: document.getElementById('filterInput')
};

// ─── Theme ──────────────────────────────────────────────────────────────────

/** Apply theme class to <html> and update toggle icon. */
function applyTheme(dark) {
  if (dark) {
    document.documentElement.classList.add('dark');
    els.themeIcon.textContent = '☀️';
    els.themeToggle.title = 'Switch to light mode';
  } else {
    document.documentElement.classList.remove('dark');
    els.themeIcon.textContent = '🌙';
    els.themeToggle.title = 'Switch to dark mode';
  }
}

/** Load saved theme or fall back to system preference. */
async function loadTheme() {
  const { theme } = await chrome.storage.local.get('theme');
  if (theme === 'dark' || theme === 'light') {
    applyTheme(theme === 'dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark);
  }
}

els.themeToggle.addEventListener('click', async () => {
  const isDark = document.documentElement.classList.contains('dark');
  const next = !isDark;
  applyTheme(next);
  await chrome.storage.local.set({ theme: next ? 'dark' : 'light' });
});

// ─── Status badge ────────────────────────────────────────────────────────────

function setStatus(text, variant = 'idle') {
  els.statusBadge.textContent = text;
  const base = 'text-[11px] px-2 py-0.5 rounded-full border';
  const variants = {
    idle: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    loading: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    error: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
  };
  els.statusBadge.className = `${base} ${variants[variant] || variants.idle}`;
}

// ─── Generic prefixes panel ──────────────────────────────────────────────────

async function loadGenericPrefixes() {
  const { genericPrefixes } = await chrome.storage.local.get('genericPrefixes');
  els.genericPrefixes.value = genericPrefixes || DEFAULT_GENERIC_PREFIXES;
}

async function saveGenericPrefixes() {
  await chrome.storage.local.set({ genericPrefixes: els.genericPrefixes.value });
  els.note.textContent = 'Prefixes saved.';
}

function toggleGenericsPrefixPanel(show) {
  els.genericsPrefixPanel.classList.toggle('hidden', !show);
}

els.ignoreGenerics.addEventListener('change', async () => {
  const checked = els.ignoreGenerics.checked;
  toggleGenericsPrefixPanel(checked);
  await chrome.storage.local.set({ ignoreGenerics: checked });
});

els.savePrefixes.addEventListener('click', saveGenericPrefixes);

// ─── Render email list ────────────────────────────────────────────────────────

function setButtonsEnabled(enabled) {
  els.copyBtn.disabled = !enabled;
  els.downloadCsvBtn.disabled = !enabled;
  els.downloadJsonBtn.disabled = !enabled;
}

function renderList() {
  const filter = (els.filterInput.value || '').trim().toLowerCase();
  const visible = filter ? emails.filter((e) => e.includes(filter)) : emails;

  els.list.innerHTML = '';
  for (const email of visible) {
    const li = document.createElement('li');
    li.className =
      'px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2';

    const span = document.createElement('span');
    span.textContent = email;
    span.className = 'truncate';

    const btn = document.createElement('button');
    btn.textContent = 'Copy';
    btn.className =
      'shrink-0 text-xs px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800';
    btn.addEventListener('click', async () => {
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

// ─── Scan ─────────────────────────────────────────────────────────────────────

async function scanPage() {
  setStatus('Scanning…', 'loading');
  els.note.textContent = '';
  els.scanBtn.disabled = true;

  try {
    const genericPrefixesRaw =
      els.genericPrefixes.value ||
      DEFAULT_GENERIC_PREFIXES;

    const genericPrefixList = genericPrefixesRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await chrome.runtime.sendMessage({
      type: 'SCAN_PAGE',
      options: {
        includeMailto: els.includeMailto.checked,
        ignoreGenerics: els.ignoreGenerics.checked,
        genericPrefixes: genericPrefixList
      }
    });

    if (!res?.ok) throw new Error(res?.error || 'Scan failed.');

    emails = res.data.emails || [];
    pageUrl = res.data.pageUrl || '';
    pageTitle = res.data.pageTitle || '';

    setStatus('Done', 'success');
    els.note.textContent = emails.length
      ? `Found ${emails.length} unique email${emails.length !== 1 ? 's' : ''}.`
      : 'No emails found on this page.';

    renderList();
  } catch (err) {
    setStatus('Error', 'error');
    els.note.textContent = err?.message || 'Unexpected error.';
    emails = [];
    pageUrl = '';
    pageTitle = '';
    renderList();
  } finally {
    els.scanBtn.disabled = false;
  }
}

// ─── Copy all ────────────────────────────────────────────────────────────────

async function copyAll() {
  if (!emails.length) return;
  await navigator.clipboard.writeText(emails.join('\n'));
  els.note.textContent = `Copied ${emails.length} emails.`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeDomainFromUrl(url) {
  try {
    return (new URL(url).hostname || 'page').replaceAll('.', '_');
  } catch {
    return 'page';
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function triggerDownload(blobUrl, filename) {
  chrome.downloads.download({ url: blobUrl, filename, saveAs: true });
  els.note.textContent = `Downloading: ${filename}`;
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function toCsv(emailsArr) {
  const rows = emailsArr.map((e) => `"${e.replaceAll('"', '""')}"`).join('\n');
  return 'email\n' + rows + '\n';
}

async function downloadCsv() {
  if (!emails.length) return;
  const csv = toCsv(emails);
  const blobUrl = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  );
  triggerDownload(blobUrl, `emails_${safeDomainFromUrl(pageUrl)}_${timestamp()}.csv`);
}

// ─── JSON export ──────────────────────────────────────────────────────────────

async function downloadJson() {
  if (!emails.length) return;
  const payload = {
    pageUrl,
    pageTitle,
    extractedAt: new Date().toISOString(),
    emails
  };
  const json = JSON.stringify(payload, null, 2);
  const blobUrl = URL.createObjectURL(
    new Blob([json], { type: 'application/json;charset=utf-8' })
  );
  triggerDownload(blobUrl, `emails_${safeDomainFromUrl(pageUrl)}_${timestamp()}.json`);
}

// ─── Clear ────────────────────────────────────────────────────────────────────

function clearAll() {
  emails = [];
  pageUrl = '';
  pageTitle = '';
  els.filterInput.value = '';
  els.note.textContent = 'Cleared.';
  setStatus('Idle', 'idle');
  renderList();
}

// ─── Event listeners ──────────────────────────────────────────────────────────

els.scanBtn.addEventListener('click', scanPage);
els.copyBtn.addEventListener('click', copyAll);
els.downloadCsvBtn.addEventListener('click', downloadCsv);
els.downloadJsonBtn.addEventListener('click', downloadJson);
els.clearBtn.addEventListener('click', clearAll);
els.filterInput.addEventListener('input', renderList);

// ─── Init ─────────────────────────────────────────────────────────────────────

(async () => {
  await loadTheme();

  // Restore persisted checkbox states
  const {
    ignoreGenerics: savedIgnoreGenerics,
    includeMailto: savedIncludeMailto
  } = await chrome.storage.local.get(['ignoreGenerics', 'includeMailto']);

  if (typeof savedIgnoreGenerics === 'boolean') {
    els.ignoreGenerics.checked = savedIgnoreGenerics;
    toggleGenericsPrefixPanel(savedIgnoreGenerics);
  }
  if (typeof savedIncludeMailto === 'boolean') {
    els.includeMailto.checked = savedIncludeMailto;
  }

  await loadGenericPrefixes();

  // Persist includeMailto on change
  els.includeMailto.addEventListener('change', async () => {
    await chrome.storage.local.set({ includeMailto: els.includeMailto.checked });
  });

  renderList();
  setStatus('Idle', 'idle');
})();
