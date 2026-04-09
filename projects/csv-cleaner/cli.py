from __future__ import annotations

import argparse
from pathlib import Path
from typing import Optional, Union

import pandas as pd

from encoding_utils import read_csv_with_fallback_encodings
from cleaner import clean_dataframe
from report_utils import write_reports

# Supported file extensions.
SUPPORTED_EXTENSIONS = {".csv", ".xlsx"}


def _read_input(
    input_path: Path,
    *,
    sep: Optional[str] = None,
    sheet: Optional[Union[str, int]] = None,
) -> tuple[pd.DataFrame, str]:
    """
    Read the input file and return (DataFrame, encoding_label).

    Auto-detects file type by extension:
    - .csv  -> read with fallback encodings
    - .xlsx -> read with pandas.read_excel using openpyxl engine
    """
    ext = input_path.suffix.lower()

    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file extension '{ext}'. "
            f"Supported extensions: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    if ext == ".csv":
        result = read_csv_with_fallback_encodings(input_path, sep=sep)
        return result.df, result.encoding_used

    # .xlsx path
    # If sheet is None, default to first sheet (sheet_name=0).
    # If sheet looks like a number (e.g. "0", "2"), treat it as an index.
    # This lets the user pass --sheet 0 or --sheet "Sheet1" without ambiguity.
    if sheet is None:
        sheet_name: Union[str, int] = 0
    elif isinstance(sheet, str) and sheet.isdigit():
        sheet_name = int(sheet)
    else:
        sheet_name = sheet

    df = pd.read_excel(
        input_path,
        sheet_name=sheet_name,
        engine="openpyxl",
        dtype=str,            # Read all columns as strings to avoid data loss.
    )

    # Fill NaN with empty string (equivalent to keep_default_na=False for CSV).
    df = df.fillna("")

    return df, "xlsx/openpyxl"


def parse_args() -> argparse.Namespace:
    """
    Parse CLI arguments.

    Simple English: This function reads user options from the terminal.
    """
    parser = argparse.ArgumentParser(
        description=(
            "Arabic/English CSV/Excel Cleaner - "
            "removes duplicates, trims spaces, fixes common encoding issues."
        )
    )
    parser.add_argument("--input", "-i", required=True, help="Input file path (.csv or .xlsx)")
    parser.add_argument("--output", "-o", required=True, help="Output cleaned CSV file path")
    parser.add_argument(
        "--sep",
        default=None,
        help="CSV separator (example: , or ;). Leave empty to auto-detect. Only used for .csv files.",
    )
    parser.add_argument(
        "--sheet",
        default=None,
        help=(
            "Sheet name or index for .xlsx files (example: Sheet1 or 0). "
            "Defaults to the first sheet if not specified."
        ),
    )
    parser.add_argument("--keep-duplicates", action="store_true", help="Do NOT remove duplicate rows")

    return parser.parse_args()


def main() -> int:
    """
    Main CLI entry point.

    Simple English: This function runs the cleaning process.
    """
    args = parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    # 1) Read input (auto-detect .csv or .xlsx by extension).
    df, encoding_used = _read_input(
        input_path,
        sep=args.sep,
        sheet=args.sheet,
    )

    # 2) Clean the DataFrame.
    cleaned_df, report = clean_dataframe(
        df,
        encoding_used=encoding_used,
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
