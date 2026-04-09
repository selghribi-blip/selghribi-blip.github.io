from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd


@dataclass
class ReadResult:
    """Small container for read results (CSV or Excel)."""
    df: pd.DataFrame
    encoding_used: str


def read_csv_with_fallback_encodings(
    input_path: str | Path,
    *,
    sep: str | None = None,
) -> ReadResult:
    """
    Read a CSV file using common encodings for Arabic/English files.

    We try multiple encodings because many CSVs in the wild are not UTF-8.
    This function returns the DataFrame and the encoding that worked.

    Notes:
    - We output later as UTF-8-SIG for best Excel support on Windows.
    """
    path = Path(input_path)
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")

    # Most common encodings (order matters).
    encodings = ["utf-8", "utf-8-sig", "cp1256", "latin1"]

    last_error: Exception | None = None

    for enc in encodings:
        try:
            # When sep is None we use the Python engine (with csv.Sniffer).
            # When sep is explicitly provided we let pandas use the C engine.
            extra: dict = {}
            if sep is None:
                extra["sep"] = ","
            else:
                extra["sep"] = sep

            df = pd.read_csv(
                path,
                encoding=enc,
                dtype=str,             # Read everything as strings to avoid data loss.
                keep_default_na=False, # Keep empty cells as "" instead of NaN.
                **extra,
            )
            return ReadResult(df=df, encoding_used=enc)
        except Exception as e:
            last_error = e

    raise ValueError(
        "Could not read CSV with common encodings. "
        "Try specifying the separator or re-export the file as UTF-8."
    ) from last_error


def read_excel(
    input_path: str | Path,
    *,
    sheet: str | int | None = None,
) -> ReadResult:
    """
    Read an Excel file (.xlsx or .xls) into a DataFrame.

    Uses openpyxl engine for .xlsx (default) and xlrd for .xls when available.
    All cells are read as strings to match the CSV reading behaviour.

    Args:
        input_path: Path to the Excel file.
        sheet: Sheet name (str) or 0-based index (int).
               Defaults to the first sheet when not provided.
    """
    path = Path(input_path)
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")

    # Determine engine from extension.
    suffix = path.suffix.lower()
    engine = "xlrd" if suffix == ".xls" else "openpyxl"

    sheet_name = sheet if sheet is not None else 0

    df = pd.read_excel(
        path,
        sheet_name=sheet_name,
        engine=engine,
        dtype=str,             # Read everything as strings to avoid data loss.
        keep_default_na=False  # Keep empty cells as "" instead of NaN.
    )

    encoding_label = f"excel/{engine}"
    return ReadResult(df=df, encoding_used=encoding_label)
