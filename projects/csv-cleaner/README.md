# 🧹 Arabic/English CSV Cleaner

> أداة تنظيف ملفات CSV للبيانات العربية/الإنجليزية — جاهزة للبيع والعمل الحر
>
> A sellable, freelance-ready tool to clean CSV files containing Arabic and/or English data.

---

## ✨ Features | المميزات

| Feature | الميزة |
|---------|--------|
| Auto-detect encoding (UTF-8, UTF-8-SIG, cp1256, latin1) | اكتشاف الترميز تلقائياً |
| Trim whitespace in all cells | إزالة المسافات الزائدة |
| Remove empty rows | حذف الصفوف الفارغة |
| Remove duplicate rows | حذف الصفوف المكررة |
| Fix non-breaking spaces | إصلاح المسافات غير القابلة للكسر |
| Optional: normalise Arabic letters (أ إ آ → ا …) | توحيد الحروف العربية (اختياري) |
| Optional: Arabic-Indic digits → Western (٣ → 3) | تحويل الأرقام الهندية (اختياري) |
| Clean column names (trim + deduplicate) | تنظيف أسماء الأعمدة |
| Output as UTF-8-SIG (Excel-friendly) | الحفظ بترميز UTF-8-SIG |
| Cleaning report (JSON + TXT) | تقرير تنظيف (JSON + نص) |
| CLI tool | أداة سطر الأوامر |
| Streamlit web UI | واجهة Streamlit |

---

## 📁 Project Structure | هيكل المشروع

```
projects/csv-cleaner/
├── app.py          # Streamlit UI
├── cli.py          # CLI entry point
├── cleaner.py      # Core cleaning functions
├── encoding.py     # Encoding detection helpers
├── report.py       # Report model and helpers
├── requirements.txt
└── README.md
```

---

## 🔧 Installation (Windows) | التثبيت على Windows

> **Requirements:** Python 3.9+ must be installed.  Download from https://python.org

```bat
:: 1. Open Command Prompt and navigate to the project folder
cd path\to\selghribi-blip.github.io

:: 2. Create a virtual environment
python -m venv .venv

:: 3. Activate it
.venv\Scripts\activate

:: 4. Install dependencies
pip install -r projects\csv-cleaner\requirements.txt
```

---

## 🖥️ Running the CLI | تشغيل من سطر الأوامر

### Basic usage

```bash
python projects/csv-cleaner/cli.py --input input.csv --output cleaned.csv
```

### All options

```bash
python projects/csv-cleaner/cli.py \
    --input   input.csv \
    --output  cleaned.csv \
    --normalize-arabic \
    --unify-digits
```

| Flag | Description |
|------|-------------|
| `--input` / `-i` | Path to the input CSV file *(required)* |
| `--output` / `-o` | Path for the cleaned output CSV *(required)* |
| `--normalize-arabic` | Normalise أ إ آ → ا, ة → ه, ى → ي |
| `--unify-digits` | Convert Arabic-Indic digits ٠–٩ → 0–9 |
| `--no-report` | Skip saving the JSON/TXT report files |

### Output files

After a successful run you will find three files next to your output CSV:

```
cleaned.csv           ← cleaned data (UTF-8-SIG, opens perfectly in Excel)
cleaned.report.json   ← machine-readable statistics
cleaned.report.txt    ← human-readable summary
```

---

## 🌐 Running the Streamlit UI | تشغيل واجهة Streamlit

```bash
streamlit run projects/csv-cleaner/app.py
```

Then open **http://localhost:8501** in your browser.

---

## 📋 Real Example | مثال حقيقي

### Input file (`contacts.csv`)

```
name,  email ,phone ,city
أحمد ,ahmed@example.com,01012345678,القاهرة
  ،  ,  ,
سارة,sara@example.com,01098765432,الرياض
أحمد ,ahmed@example.com,01012345678,القاهرة
```

**Problems in this file:**
- Column names have extra spaces (`name` vs `  email `)
- Row 3 is completely empty
- Row 4 is a duplicate of Row 1
- Leading/trailing spaces in cell values

### Run the cleaner

```bash
python projects/csv-cleaner/cli.py --input contacts.csv --output contacts_cleaned.csv
```

### Output (`contacts_cleaned.csv`)

```
name,email,phone,city
أحمد,ahmed@example.com,01012345678,القاهرة
سارة,sara@example.com,01098765432,الرياض
```

### Report summary

```
====================================
 تقرير التنظيف | Cleaning Report
====================================
الترميز المستخدم  | Encoding used    : utf-8-sig
الصفوف في الإدخال | Rows in          : 4
الصفوف الفارغة    | Empty rows removed: 1
الصفوف المكررة    | Duplicates removed: 1
الصفوف في الإخراج | Rows out         : 2
الأعمدة المُنظَّفة | Columns cleaned  : 3
====================================
```

---

## 💰 How to Make Money | كيف تربح من هذه الأداة

### 1. 🟡 Fiverr Gig — خدمة على Fiverr

Create a gig titled **"I will clean your Arabic/English Excel or CSV data"**.

- Charge $10–$30 per file.
- Use this tool behind the scenes — each job takes you **< 5 minutes**.
- Upsell: offer a "monthly data cleaning" package for recurring income.

**Keywords to use:** data cleaning, CSV cleaner, Arabic Excel, data entry cleanup, Excel Arabic fix.

---

### 2. 🔵 Upwork Service — خدمة على Upwork

Post a profile as a **Data Cleaning Specialist**.

- Target clients who post jobs like: "clean my customer list", "fix my product CSV".
- Offer a free sample clean of 100 rows to win your first client.
- Bundle with simple reporting (the JSON/TXT reports from this tool make you look professional).

**Hourly rate suggestion:** $15–$40/hr depending on your experience level.

---

### 3. 🟣 Gumroad Digital Product — منتج رقمي على Gumroad

Package this tool as a **"CSV Cleaner for Arabic Data"** digital product.

- Sell for $9–$19 as a one-time download.
- Include: the tool + a PDF tutorial + 3 sample CSV files.
- Add a "Pro" tier ($29) with a video walkthrough and email support.

**Tips:**
- Record a 2-minute demo video and embed it in the Gumroad listing.
- Add Arabic and English descriptions to reach both markets.
- Collect emails and build a small mailing list for future products.
