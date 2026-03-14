from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import pandas as pd


@dataclass
class ReadResult:
    """Small container for CSV read results."""
    df: pd.DataFrame
    encoding_used: str


def read_csv_with_fallback_encodings(
    input_path: str | Path,
    *,
    sep: Optional[str] = None,
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

    last_error: Optional[Exception] = None

    for enc in encodings:
        try:
            # When sep is None, use engine='python' so pandas can auto-detect.
            extra: dict = {}
            if sep is None:
                extra["engine"] = "python"

            df = pd.read_csv(
                path,
                encoding=enc,
                sep=sep,               # If None, pandas auto-detects with engine='python'.
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
