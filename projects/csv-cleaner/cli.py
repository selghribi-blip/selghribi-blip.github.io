from __future__ import annotations

import argparse
from pathlib import Path

from encoding_utils import read_csv_with_fallback_encodings, read_excel
from cleaner import clean_dataframe
from report_utils import write_reports

# Extensions treated as Excel files.
EXCEL_EXTENSIONS = {".xlsx", ".xls"}


def parse_args() -> argparse.Namespace:
    """
    Parse CLI arguments.

    Simple English: This function reads user options from the terminal.
    The tool auto-detects whether the input is CSV or Excel based on its
    file extension, so no extra flag is needed.
    """
    parser = argparse.ArgumentParser(
        description=(
            "Arabic/English CSV/Excel Cleaner\n"
            "أداة تنظيف ملفات CSV و Excel (عربي + English)\n\n"
            "Removes duplicates, trims spaces, and fixes common encoding issues.\n"
            "يحذف التكرارات، يقصّ المسافات، ويصلح مشاكل الترميز الشائعة."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Input file path (.csv, .xlsx, or .xls)",
    )
    parser.add_argument(
        "--output", "-o",
        required=True,
        help="Output cleaned CSV file path",
    )
    parser.add_argument(
        "--sep",
        default=None,
        help="CSV separator (example: , or ;). Leave empty to auto-detect. Ignored for Excel files.",
    )
    parser.add_argument(
        "--sheet",
        default=None,
        help=(
            "Excel sheet name or 0-based index (example: Sheet1 or 0). "
            "Defaults to the first sheet. Ignored for CSV files."
        ),
    )
    parser.add_argument(
        "--keep-duplicates",
        action="store_true",
        help="Do NOT remove duplicate rows",
    )

    return parser.parse_args()


def _resolve_sheet(sheet_arg: str | None) -> str | int | None:
    """
    Convert the --sheet argument to the right type for pandas.

    If it looks like a plain integer string (e.g. "0", "2"), convert to int
    so pandas treats it as a sheet index.  Otherwise keep it as a string
    (sheet name).
    """
    if sheet_arg is None:
        return None
    try:
        return int(sheet_arg)
    except ValueError:
        return sheet_arg


def main() -> int:
    """
    Main CLI entry point.

    Simple English: This function runs the cleaning process and supports
    both CSV and Excel (.xlsx / .xls) inputs automatically.
    """
    args = parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    # 1) Read input — auto-detect format by extension.
    suffix = input_path.suffix.lower()
    if suffix in EXCEL_EXTENSIONS:
        sheet = _resolve_sheet(args.sheet)
        read_result = read_excel(input_path, sheet=sheet)
    else:
        # Default: treat as CSV.
        read_result = read_csv_with_fallback_encodings(input_path, sep=args.sep)

    # 2) Clean.
    cleaned_df, report = clean_dataframe(
        read_result.df,
        encoding_used=read_result.encoding_used,
        remove_duplicates=(not args.keep_duplicates),
    )

    # 3) Save output as UTF-8-SIG so Excel opens Arabic correctly.
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cleaned_df.to_csv(output_path, index=False, encoding="utf-8-sig")

    # 4) Write report files.
    json_path, txt_path = write_reports(output_path, report)

    print("Done.")
    print(f"Cleaned CSV saved to: {output_path}")
    print(f"Report JSON saved to: {json_path}")
    print(f"Report TXT saved to: {txt_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
