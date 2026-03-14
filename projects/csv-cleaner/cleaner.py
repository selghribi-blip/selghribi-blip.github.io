from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, Tuple

import pandas as pd


@dataclass
class CleanReport:
    """Report numbers to help the user understand what changed."""
    rows_in: int
    rows_out: int
    empty_rows_removed: int
    duplicates_removed: int
    columns_cleaned: int
    encoding_used: str

    def to_dict(self) -> Dict:
        """Convert report to a JSON-serializable dict."""
        return asdict(self)


def _normalize_text_cell(value: str) -> str:
    """
    Normalize a single text cell (Arabic + English safe).

    Simple rules only (safe for most clients):
    - Replace non-breaking space with normal space.
    - Trim spaces.
    """
    if value is None:
        return ""

    text = str(value)

    # Replace NBSP (common issue when copying from web or Word).
    text = text.replace("\u00A0", " ")

    # Trim spaces.
    text = text.strip()

    return text


def _dedupe_column_names(columns: list[str]) -> Tuple[list[str], int]:
    """
    Make column names unique.

    If duplicates exist, append _2, _3, ... to keep them.
    Returns (new_columns, number_of_changed_columns).
    """
    seen: Dict[str, int] = {}
    new_cols: list[str] = []
    changed = 0

    for col in columns:
        base = _normalize_text_cell(col)
        if base == "":
            base = "column"

        if base not in seen:
            seen[base] = 1
            new_cols.append(base)
        else:
            seen[base] += 1
            new_name = f"{base}_{seen[base]}"
            new_cols.append(new_name)
            changed += 1

    return new_cols, changed


def clean_dataframe(
    df: pd.DataFrame,
    *,
    encoding_used: str,
    remove_duplicates: bool = True,
) -> tuple[pd.DataFrame, CleanReport]:
    """
    Clean a DataFrame using simple, client-friendly rules.

    Steps:
    1) Clean column names (trim + dedupe).
    2) Normalize all string cells (trim, fix NBSP).
    3) Remove fully empty rows.
    4) Remove duplicate rows.
    """
    rows_in = len(df)

    # 1) Clean column names.
    original_columns = list(df.columns)
    cleaned_columns, cols_changed = _dedupe_column_names([str(c) for c in original_columns])
    df = df.copy()
    df.columns = cleaned_columns

    # 2) Normalize all cells.
    # We keep everything as string and apply normalization cell by cell.
    for col in df.columns:
        df[col] = df[col].map(_normalize_text_cell)

    # 3) Remove fully empty rows (all columns empty after stripping).
    before_empty = len(df)
    df = df.loc[~df.astype(str).apply(lambda x: x.str.strip()).eq("").all(axis=1)].copy()
    after_empty = len(df)
    empty_rows_removed = before_empty - after_empty

    # 4) Remove duplicates.
    duplicates_removed = 0
    if remove_duplicates:
        before_dup = len(df)
        df = df.drop_duplicates(keep="first").copy()
        after_dup = len(df)
        duplicates_removed = before_dup - after_dup

    rows_out = len(df)

    report = CleanReport(
        rows_in=rows_in,
        rows_out=rows_out,
        empty_rows_removed=empty_rows_removed,
        duplicates_removed=duplicates_removed,
        columns_cleaned=cols_changed,
        encoding_used=encoding_used,
    )

    return df, report
