from __future__ import annotations

import json
from pathlib import Path

from cleaner import CleanReport


def write_reports(output_csv_path: str | Path, report: CleanReport) -> tuple[Path, Path]:
    """
    Write two report files next to the output file:
    - .report.json
    - .report.txt

    This is useful for freelance clients: you can show what changed.
    """
    out_path = Path(output_csv_path)
    json_path = out_path.with_suffix(out_path.suffix + ".report.json")
    txt_path = out_path.with_suffix(out_path.suffix + ".report.txt")

    json_path.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")

    txt_lines = [
        "CSV Cleaner Report",
        "------------------",
        f"Rows in: {report.rows_in}",
        f"Rows out: {report.rows_out}",
        f"Empty rows removed: {report.empty_rows_removed}",
        f"Duplicate rows removed: {report.duplicates_removed}",
        f"Columns renamed/deduped: {report.columns_cleaned}",
        f"Encoding used to read input: {report.encoding_used}",
        "",
        "Output encoding: UTF-8-SIG (best for Excel on Windows)",
    ]
    txt_path.write_text("\n".join(txt_lines), encoding="utf-8")

    return json_path, txt_path
