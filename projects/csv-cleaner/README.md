# CSV / Excel Cleaner (Arabic + English)

أداة سطر أوامر لتنظيف ملفات CSV وExcel التي تحتوي على بيانات عربية وإنجليزية.  
A command-line tool to clean CSV and Excel files with Arabic + English data.

## What it does

- حذف الصفوف الفارغة — Remove empty rows
- حذف الصفوف المكررة — Remove duplicate rows
- حذف المسافات الزائدة في الخلايا — Trim extra spaces in cells
- محاولة قراءة CSV بترميزات شائعة (UTF-8, UTF-8-SIG, cp1256, latin1) — Try common encodings for CSV
- قراءة ملفات Excel (.xlsx) باستخدام openpyxl — Read Excel (.xlsx) files via openpyxl
- اختيار ورقة عمل محددة داخل Excel — Pick a specific sheet in Excel

## Supported file types

| Extension | Support |
|-----------|---------|
| `.csv`    | ✅ Auto-detect encoding |
| `.xlsx`   | ✅ openpyxl engine |
| `.xls`    | ❌ Not supported (use Save As → .xlsx in Excel) |

## Install

1. Install Python 3.10+
2. Open a terminal in the project folder.
3. Create a virtual environment:

```bash
python -m venv .venv
```

4. Activate the virtual environment:

```bash
# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

5. Install dependencies:

```bash
pip install -r projects/csv-cleaner/requirements.txt
```

## Usage

### Clean a CSV file

```bash
python projects/csv-cleaner/cli.py -i input.csv -o cleaned.csv
```

### Clean a CSV file with custom separator

```bash
python projects/csv-cleaner/cli.py -i input.csv -o cleaned.csv --sep ";"
```

### Clean an Excel (.xlsx) file — first sheet (default)

```bash
python projects/csv-cleaner/cli.py -i input.xlsx -o cleaned.csv
```

### Clean an Excel file — specific sheet by name

```bash
python projects/csv-cleaner/cli.py -i input.xlsx -o cleaned.csv --sheet "Sheet1"
```

### Clean an Excel file — specific sheet by index (0 = first sheet)

```bash
python projects/csv-cleaner/cli.py -i input.xlsx -o cleaned.csv --sheet 0
```

### Keep duplicate rows (skip deduplication)

```bash
python projects/csv-cleaner/cli.py -i input.xlsx -o cleaned.csv --keep-duplicates
```

## Arguments

| Argument | Short | Required | Description |
|----------|-------|----------|-------------|
| `--input` | `-i` | ✅ | Input file path (`.csv` or `.xlsx`) |
| `--output` | `-o` | ✅ | Output cleaned CSV file path |
| `--sep` | | ❌ | CSV column separator (e.g. `,` or `;`). CSV only. Auto-detected if omitted. |
| `--sheet` | | ❌ | Sheet name or index for `.xlsx` files. Defaults to the first sheet (`0`). |
| `--keep-duplicates` | | ❌ | Keep duplicate rows (skip deduplication). |

## Output

For every run, three files are created:

| File | Description |
|------|-------------|
| `cleaned.csv` | Cleaned data, UTF-8-SIG encoding (Excel-friendly, Arabic readable) |
| `cleaned.csv.report.json` | Machine-readable summary of changes |
| `cleaned.csv.report.txt` | Human-readable summary of changes |

## Real example

### Before (`customers.csv`)

```
Name,Phone,City
أحمد  ,  0501234567,الرياض
أحمد  ,  0501234567,الرياض
,, 
فاطمة, 0509876543 ,جدة
```

### Command

```bash
python projects/csv-cleaner/cli.py -i customers.csv -o customers.cleaned.csv
```

### After (`customers.cleaned.csv`)

```
Name,Phone,City
أحمد,0501234567,الرياض
فاطمة,0509876543,جدة
```

**Report summary:**
- Rows in: 4
- Rows out: 2
- Empty rows removed: 1
- Duplicate rows removed: 1

## Excel example

### Command

```bash
python projects/csv-cleaner/cli.py -i sales_report.xlsx -o sales_cleaned.csv --sheet "January"
```

Reads the sheet named **January** from `sales_report.xlsx`, cleans it, and saves a UTF-8-SIG CSV file.

## Easy to customize for clients

In `cleaner.py`, you can add:
- Phone number normalization
- Email validation
- Column mapping / rename
- Remove emojis or special symbols

## How to make money (3 ideas)

1. **Fiverr gig**: "I will clean and fix your Excel/CSV data (Arabic + English)"
2. **Upwork service**: Offer "data cleaning + weekly automation" for small businesses
3. **Gumroad product**: Sell this as a small Windows-friendly tool + tutorial video
