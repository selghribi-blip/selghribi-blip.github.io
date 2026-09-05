# 📧 Email Extractor — Chrome Extension (Manifest V3)

Extract all email addresses from the current web page and export them as a CSV file with one click.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Smart extraction** | Scans page text, HTML source, and `mailto:` links |
| **Deduplication** | Returns unique emails only, sorted alphabetically |
| **False-positive filter** | Skips placeholder domains (`example.com`, etc.) and code-like TLDs (`.js`, `.png`) |
| **Copy to clipboard** | Copy all emails at once, or copy individual addresses |
| **Download CSV** | Exports a CSV with a header row; filename includes domain + timestamp |
| **Beautiful popup** | Responsive 360 px popup with status states: Idle / Scanning / Done / Error |
| **Offline-safe** | No remote CSS/JS — fully bundled, compliant with Chrome Web Store CSP |

---

## 📂 Folder Structure

```
extensions/email-extractor/
├── manifest.json      ← MV3 manifest
├── background.js      ← Service worker (handles scripting & downloads)
├── content.js         ← Injected into active tab to extract emails
├── popup.html         ← Popup UI entry point
├── popup.js           ← Popup interaction logic
├── styles.css         ← Bundled utility CSS (Tailwind-inspired, no CDN)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          ← This file
```

---

## 🚀 Install in Chrome (Developer / Load Unpacked)

1. **Download or clone** this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** (top-right switch) to **ON**.
4. Click **"Load unpacked"**.
5. Select the folder:
   ```
   extensions/email-extractor/
   ```
6. The extension icon appears in your Chrome toolbar.

> **Tip:** Pin it by clicking the puzzle piece (🧩) icon → Pin "Email Extractor".

---

## 🎯 Usage

1. Navigate to any web page that contains email addresses.
2. Click the **Email Extractor** icon in the toolbar.
3. Click **"Scan Page"** — the extension scans the active tab.
4. Review the list of extracted emails and the count.
5. Use **"Copy"** to copy all emails to clipboard, or click **"Copy"** next to a single address.
6. Click **"Download CSV"** to save a `.csv` file:
   - **Header row:** `email`
   - **One email per row**
   - **Filename:** `emails_<domain>_<YYYYMMDD_HHmmss>.csv`
7. Click **"Clear"** to reset and scan again.

### Options
| Option | Default | Effect |
|---|---|---|
| Include `mailto:` links | ✅ Checked | Includes emails from `href="mailto:…"` anchor tags |
| Filter placeholders | ✅ Checked | Removes example/test domains and code-like TLDs |

---

## 📦 Package for the Chrome Web Store

### Step 1 — Prepare the folder
Remove any development-only files (`.DS_Store`, `*.map`, temporary files).

### Step 2 — Create the ZIP
```bash
# From the repository root
cd extensions/email-extractor
zip -r ../email-extractor.zip . --exclude "*.DS_Store" --exclude "**/__MACOSX/*"
```
This produces `extensions/email-extractor.zip`.

### Step 3 — Upload to Chrome Web Store
1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Click **"New item"** and upload `email-extractor.zip`.
3. Fill in the store listing:
   - **Name:** Email Extractor
   - **Short description:** Extract & export email addresses from any web page as a CSV file.
   - **Category:** Productivity
   - **Screenshots:** Add at least one screenshot (1280×800 or 640×400 px).

> **Store policy reminder:** The extension uses only bundled CSS/JS — no remote code loading — so it complies with Chrome Web Store Content Security Policy requirements.

---

## 🖼 Screenshots

> _Place your screenshots in `extensions/email-extractor/screenshots/`._

| Screenshot | Path |
|---|---|
| Popup — idle state | `screenshots/popup-idle.png` |
| Popup — scan results | `screenshots/popup-results.png` |
| CSV export example | `screenshots/csv-export.png` |

---

## 🔐 Permissions Used

| Permission | Why it's needed |
|---|---|
| `activeTab` | Access the currently active tab's URL and metadata |
| `scripting` | Inject `content.js` into the active tab to read the page |
| `downloads` | Trigger the CSV file download |

No data is ever sent to external servers. All processing happens locally in the browser.

---

## 🛠 Development Notes

### Modifying the CSS
`styles.css` contains hand-picked Tailwind-compatible utility classes compiled inline.  
If you want to regenerate it with the full Tailwind CLI:

```bash
npm install -D tailwindcss
npx tailwindcss -i ./src/input.css -o ./styles.css --minify
```

### Running linters
The extension has no build step. Open `chrome://extensions/` and click **"Reload"** after any change.

### Adding new icon sizes
Icons are simple PNG files. Generate new sizes using any image editor
(e.g. GIMP, Inkscape, or Photoshop), then save them to `icons/icon<size>.png`.

---

## 📋 Changelog

### v1.0.0
- Initial release
- Scan page text + HTML + `mailto:` links
- Deduplicate, normalise, filter false positives
- Copy to clipboard (all or individual)
- Download CSV with domain + timestamp filename
- Options: include mailto / filter placeholders
