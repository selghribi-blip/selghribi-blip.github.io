# CSV / Excel Cleaner (Arabic + English)
# أداة تنظيف ملفات CSV و Excel (عربي + English)

أداة سطر أوامر بسيطة لتنظيف ملفات CSV و Excel التي تحتوي على بيانات عربية أو إنجليزية.  
A simple command-line tool to clean CSV and Excel files containing Arabic or English data.

## What it does / ما تفعله الأداة

- حذف الصفوف الفارغة — Remove empty rows  
- حذف الصفوف المكررة — Remove duplicate rows  
- قصّ المسافات الزائدة من الخلايا — Trim spaces in cells  
- قراءة CSV بترميزات متعددة (UTF-8, UTF-8-SIG, cp1256, latin1) — Try common encodings  
- **قراءة ملفات Excel (.xlsx / .xls) مباشرةً — Read Excel files directly**  
- الإخراج دائمًا CSV بترميز UTF-8-SIG (يفتح بشكل صحيح في Excel على Windows)  
  Output is always a UTF-8-SIG CSV (opens correctly in Excel on Windows)

## Install / التثبيت

### Windows (PowerShell)

```bash
# 1) Create virtual environment
python -m venv .venv

# 2) Activate
.venv\Scripts\activate

# 3) Install dependencies
pip install -r projects/csv-cleaner/requirements.txt
```

### Linux / macOS (Bash)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r projects/csv-cleaner/requirements.txt
```

## Run / التشغيل

### Clean a CSV file

```bash
python projects/csv-cleaner/cli.py -i data/input.csv -o data/cleaned.csv
```

With a semicolon separator:

```bash
python projects/csv-cleaner/cli.py -i data/input.csv -o data/cleaned.csv --sep ";"
```

### Clean an Excel file (.xlsx)

```bash
python projects/csv-cleaner/cli.py -i input.xlsx -o cleaned.csv
```

With a specific sheet name:

```bash
python projects/csv-cleaner/cli.py -i input.xlsx -o cleaned.csv --sheet "Sheet2"
```

With a 0-based sheet index:

```bash
python projects/csv-cleaner/cli.py -i input.xlsx -o cleaned.csv --sheet 1
```

### Keep duplicate rows (skip deduplication)

```bash
python projects/csv-cleaner/cli.py -i input.xlsx -o cleaned.csv --keep-duplicates
```

## Output files / ملفات الإخراج

For each run, three files are created:

| File | Description |
|------|-------------|
| `cleaned.csv` | Cleaned data (UTF-8-SIG) |
| `cleaned.csv.report.json` | Machine-readable report |
| `cleaned.csv.report.txt`  | Human-readable report |

## One real example / مثال واقعي

### Before (customers.xlsx, Sheet1)

| Name        | Email             | Phone       |
|-------------|-------------------|-------------|
| أحمد  علي   | ahmed@example.com | 0501234567  |
| أحمد  علي   | ahmed@example.com | 0501234567  |
| (empty row) |                   |             |
| Sara  Ahmed | sara@example.com  | 0559876543  |

### Command

```bash
python projects/csv-cleaner/cli.py -i customers.xlsx -o customers_cleaned.csv
```

### After (customers_cleaned.csv)

| Name      | Email             | Phone      |
|-----------|-------------------|------------|
| أحمد علي  | ahmed@example.com | 0501234567 |
| Sara Ahmed | sara@example.com  | 0559876543 |

**Report summary:**  
- Rows in: 4  
- Rows out: 2  
- Empty rows removed: 1  
- Duplicate rows removed: 1

## Easy to customize / سهل التخصيص لعملاء مختلفين

In `cleaner.py` you can add:

- Phone number normalization
- Email validation
- Column mapping / rename
- Remove emojis or special symbols

## How to make money / كيف تكسب من هذه الأداة

1. **Fiverr**: خدمة "تنظيف ملفات Excel/CSV بالعربية والإنجليزية" مع تسليم تقرير  
   *"I will clean and fix your Excel/CSV data (Arabic + English)"*

2. **Upwork**: باقة شهرية — تنظيف أسبوعي + تحويل CSV إلى تقرير  
   *Monthly package: weekly data cleaning + report*

3. **Gumroad**: تبيعها كـ mini tool مع فيديو شرح + ملفات مثال  
   *Sell as a digital product with a tutorial video*
