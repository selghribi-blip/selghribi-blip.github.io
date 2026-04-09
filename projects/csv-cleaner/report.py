"""
report.py — Cleaning report model and helpers.

The CleaningReport dataclass holds all statistics produced during a cleaning
run.  Two helper functions serialise it to JSON and to human-readable text.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field


@dataclass
class CleaningReport:
    """Holds all statistics for one CSV cleaning run."""

    rows_in: int = 0               # Total rows read from the input file.
    rows_out: int = 0              # Rows written to the output file.
    empty_rows_removed: int = 0    # Rows that were completely empty.
    duplicates_removed: int = 0    # Duplicate rows that were dropped.
    columns_cleaned: int = 0       # Number of column names that were trimmed/deduped.
    encoding_used: str = ""        # Encoding that was used to read the file.
    columns: list[str] = field(default_factory=list)  # Final column names.


def report_to_json(report: CleaningReport) -> str:
    """
    Serialise a CleaningReport to a pretty-printed JSON string.

    Args:
        report: The CleaningReport instance to serialise.

    Returns:
        A JSON string with 2-space indentation.
    """
    return json.dumps(asdict(report), ensure_ascii=False, indent=2)


def report_to_text(report: CleaningReport) -> str:
    """
    Serialise a CleaningReport to a human-readable plain-text string.
    Both Arabic and English labels are included.

    Args:
        report: The CleaningReport instance to serialise.

    Returns:
        A multi-line string suitable for saving as a .txt file.
    """
    lines = [
        "====================================",
        " تقرير التنظيف | Cleaning Report",
        "====================================",
        f"الترميز المستخدم  | Encoding used    : {report.encoding_used}",
        f"الصفوف في الإدخال | Rows in          : {report.rows_in}",
        f"الصفوف الفارغة    | Empty rows removed: {report.empty_rows_removed}",
        f"الصفوف المكررة    | Duplicates removed: {report.duplicates_removed}",
        f"الصفوف في الإخراج | Rows out         : {report.rows_out}",
        f"الأعمدة المُنظَّفة | Columns cleaned  : {report.columns_cleaned}",
        "------------------------------------",
        "الأعمدة | Columns:",
    ]
    for col in report.columns:
        lines.append(f"  - {col}")
    lines.append("====================================")
    return "\n".join(lines)


def save_report(report: CleaningReport, output_path: str) -> tuple[str, str]:
    """
    Save both a JSON and a plain-text version of the report next to the
    output CSV file.

    Convention:  if output_path is 'cleaned.csv' the report files will be
                 'cleaned.report.json' and 'cleaned.report.txt'.

    Args:
        report:      The CleaningReport to save.
        output_path: Path to the cleaned CSV file.

    Returns:
        A tuple (json_path, txt_path) with the paths of the two saved files.
    """
    # Strip the extension from the output path to build report filenames.
    base = output_path.rsplit(".", 1)[0] if "." in output_path else output_path

    json_path = base + ".report.json"
    txt_path = base + ".report.txt"

    with open(json_path, "w", encoding="utf-8") as fh:
        fh.write(report_to_json(report))

    with open(txt_path, "w", encoding="utf-8") as fh:
        fh.write(report_to_text(report))

    return json_path, txt_path
