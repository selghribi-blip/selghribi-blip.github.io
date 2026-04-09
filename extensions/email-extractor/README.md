# Email Extractor → CSV

A Chrome Extension (Manifest V3) that extracts unique email addresses from the current web page and exports them as a CSV file. Styled with **real Tailwind CSS** (no CDN — fully bundled locally).

---

## Folder structure

```
extensions/email-extractor/
├── manifest.json          # MV3 manifest
├── background.js          # Service worker
├── content.js             # Email extraction logic
├── popup.html             # Extension popup (links to tailwind.css)
├── popup.js               # Popup UI logic
├── tailwind.css           # Generated CSS (do not edit — run build:css)
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
├── package.json           # NPM scripts & devDependencies
├── src/
│   └── input.css          # Tailwind directives entry point
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Setup & Build

### 1. Install dependencies

```bash
cd extensions/email-extractor
npm install
```

### 2. Build the CSS

```bash
npm run build:css
```

This runs `tailwindcss -i ./src/input.css -o ./tailwind.css --minify` and produces a minified `tailwind.css` used by the popup.

### 3. Watch for changes (development)

```bash
npm run watch:css
```

Rebuilds `tailwind.css` automatically whenever you edit `popup.html`, `popup.js`, or the input CSS.

---

## Load unpacked in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extensions/email-extractor/` folder
5. Open any web page with email addresses, click the extension icon, then **Scan page**

---

## Features

- Scans visible page text and `mailto:` links
- Deduplicates and normalises email addresses
- Copy individual emails or copy all at once
- Export all results as a CSV file (one email per row)
- Filter emails in real time
- Clean dark popup UI built with Tailwind CSS (fully local — no remote resources)

---

## Packaging for the Chrome Web Store

1. **Build the CSS first:**

   ```bash
   npm run build:css
   ```

2. **Create a ZIP** (from the `email-extractor/` directory):

   ```bash
   cd extensions/email-extractor
   zip -r ../../email-extractor-extension.zip . \
     --exclude "node_modules/*" \
     --exclude "src/*" \
     --exclude "tailwind.config.js" \
     --exclude "postcss.config.js" \
     --exclude "package.json" \
     --exclude "package-lock.json" \
     --exclude "README.md" \
     --exclude "*.DS_Store"
   ```

   The ZIP must contain:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `popup.html`
   - `popup.js`
   - `tailwind.css` ← the generated file
   - `icons/icon16.png`, `icon48.png`, `icon128.png`

3. **Submit to Chrome Web Store:**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay the one-time developer registration fee (if required)
   - Click **New item** and upload the ZIP
   - Fill in the listing details (name, description, screenshots, privacy disclosure)
   - Submit for review

### Privacy disclosure (required)

> This extension scans the **current tab's page content** only when the user explicitly clicks **Scan page**. No data is sent to any server. The extension has no remote dependencies.

---

## Why no CDN?

The Chrome Web Store and Manifest V3 policies strongly discourage (and in some contexts disallow) loading remote scripts or stylesheets at runtime. This project bundles `tailwind.css` **at build time** using the Tailwind CLI so the extension works entirely offline and passes Store review without remote-resource warnings.

---

## Improving the extension

| Idea | Notes |
|------|-------|
| Export to JSON | Add a `toJson()` helper in `popup.js` |
| Per-domain regex tuning | Extend `isProbablyValidEmail()` in `content.js` |
| Ignore list for domains | Add a Set of blocked domains |
| Scan all open tabs | Requires `"tabs"` permission + loop over `chrome.tabs.query` |
| Save results across sessions | Use `chrome.storage.local` |
