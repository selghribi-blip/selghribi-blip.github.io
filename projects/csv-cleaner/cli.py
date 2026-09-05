"""
cli.py — Command-line interface for the Arabic/English CSV cleaner.

Usage example:
    python projects/csv-cleaner/cli.py --input data.csv --output cleaned.csv

Run  python projects/csv-cleaner/cli.py --help  for all options.
"""

from __future__ import annotations

import argparse
import os
import sys

# Add this directory to the path so we can import sibling modules.
sys.path.insert(0, os.path.dirname(__file__))

from cleaner import clean_file
from report import report_to_text, save_report


def build_parser() -> argparse.ArgumentParser:
    """Build and return the argument parser for the CLI."""
    parser = argparse.ArgumentParser(
        prog="csv-cleaner",
        description=(
            "تنظيف ملفات CSV للبيانات العربية/الإنجليزية\n"
            "Clean CSV files containing Arabic/English data.\n\n"
            "Output is always saved as UTF-8-SIG (Excel-compatible)."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "--input", "-i",
        required=True,
        metavar="INPUT.CSV",
        help="Path to the input CSV file.  (المسار إلى ملف CSV المدخل)",
    )
    parser.add_argument(
        "--output", "-o",
        required=True,
        metavar="OUTPUT.CSV",
        help="Path for the cleaned output CSV.  (مسار ملف CSV المنظَّف)",
    )
    parser.add_argument(
        "--normalize-arabic",
        action="store_true",
        default=False,
        help=(
            "Normalise Arabic letter variants (أ إ آ → ا, ة → ه, ى → ي).  "
            "(توحيد أشكال الحروف العربية)"
        ),
    )
    parser.add_argument(
        "--unify-digits",
        action="store_true",
        default=False,
        help=(
            "Convert Arabic-Indic digits (٠–٩) to Western digits (0–9).  "
            "(تحويل الأرقام الهندية إلى أرقام غربية)"
        ),
    )
    parser.add_argument(
        "--no-report",
        action="store_true",
        default=False,
        help="Skip saving the cleaning report files.",
    )
    return parser


def main() -> None:
    """Entry point: parse arguments, run the cleaner, print summary."""
    parser = build_parser()
    args = parser.parse_args()

    # --- Validate input file ---
    if not os.path.isfile(args.input):
        print(f"[ERROR] Input file not found: '{args.input}'", file=sys.stderr)
        sys.exit(1)

    # --- Validate output directory exists ---
    out_dir = os.path.dirname(os.path.abspath(args.output))
    if not os.path.isdir(out_dir):
        print(f"[ERROR] Output directory does not exist: '{out_dir}'", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Reading  : {args.input}")
    print(f"[INFO] Writing  : {args.output}")

    try:
        report = clean_file(
            input_path=args.input,
            output_path=args.output,
            normalize_arabic=args.normalize_arabic,
            unify_digits=args.unify_digits,
        )
    except Exception as exc:
        print(f"[ERROR] Cleaning failed: {exc}", file=sys.stderr)
        sys.exit(1)

    # --- Print report to terminal ---
    print()
    print(report_to_text(report))

    # --- Save report files unless --no-report was passed ---
    if not args.no_report:
        json_path, txt_path = save_report(report, args.output)
        print(f"\n[INFO] Report saved:")
        print(f"       JSON : {json_path}")
        print(f"       Text : {txt_path}")

    print("\n[INFO] Done ✓")


if __name__ == "__main__":
    main()
