"""
cleaner.py — Core CSV cleaning functions for Arabic/English data.

All public functions are stateless: they accept a pandas DataFrame and return
a new (cleaned) DataFrame plus any statistics needed for the report.
"""

from __future__ import annotations

import re
import unicodedata

import pandas as pd

from encoding import detect_encoding
from report import CleaningReport

# ------------------------------------------------------------------
# Arabic normalisation maps
# ------------------------------------------------------------------

# Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) → Western digits (0–9)
_ARABIC_INDIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

# Conservative Arabic letter normalisation:
#   أ إ آ ٱ  →  ا
#   ة        →  ه
#   ى        →  ي
_ARABIC_LETTERS_MAP = str.maketrans(
    {
        "\u0623": "\u0627",  # أ → ا
        "\u0625": "\u0627",  # إ → ا
        "\u0622": "\u0627",  # آ → ا
        "\u0671": "\u0627",  # ٱ → ا
        "\u0629": "\u0647",  # ة → ه
        "\u0649": "\u064a",  # ى → ي
    }
)

# Non-breaking space variants → regular space
_NBSP_RE = re.compile(r"[\xa0\u200b\u200c\u200d\ufeff\u00ad]")


# ------------------------------------------------------------------
# Text normalisation helpers
# ------------------------------------------------------------------


def _normalize_cell(
    value: object,
    normalize_arabic: bool = False,
    unify_digits: bool = False,
) -> object:
    """
    Normalise a single cell value:
      1. Skip non-string cells (numbers, NaN, …).
      2. Replace non-breaking spaces with regular spaces.
      3. Strip leading/trailing whitespace.
      4. Optionally unify Arabic-Indic digits to Western digits.
      5. Optionally apply conservative Arabic letter normalisation.

    Args:
        value:            The cell value to normalise.
        normalize_arabic: If True, normalise common Arabic letter variants.
        unify_digits:     If True, convert Arabic-Indic digits to 0–9.

    Returns:
        The normalised value (same type as input if not a string).
    """
    if not isinstance(value, str):
        return value

    # Replace non-breaking space variants.
    text = _NBSP_RE.sub(" ", value)

    # Strip outer whitespace.
    text = text.strip()

    # Unify Arabic-Indic digits.
    if unify_digits:
        text = text.translate(_ARABIC_INDIC_DIGITS)

    # Conservative Arabic letter normalisation.
    if normalize_arabic:
        text = text.translate(_ARABIC_LETTERS_MAP)

    return text


# ------------------------------------------------------------------
# Column name helpers
# ------------------------------------------------------------------


def clean_column_names(columns: pd.Index) -> tuple[list[str], int]:
    """
    Clean column names by:
      1. Trimming leading/trailing whitespace.
      2. De-duplicating by appending _2, _3, … for repeated names.

    Args:
        columns: Original pandas Index of column names.

    Returns:
        A tuple (new_column_names, cleaned_count) where cleaned_count is the
        number of columns whose name actually changed.
    """
    seen: dict[str, int] = {}
    new_cols: list[str] = []
    cleaned = 0

    for original in columns:
        trimmed = str(original).strip()

        if trimmed in seen:
            # Append a suffix to make the name unique.
            seen[trimmed] += 1
            new_name = f"{trimmed}_{seen[trimmed]}"
        else:
            seen[trimmed] = 1
            new_name = trimmed

        if new_name != str(original):
            cleaned += 1

        new_cols.append(new_name)

    return new_cols, cleaned


# ------------------------------------------------------------------
# Main cleaning pipeline
# ------------------------------------------------------------------


def clean_dataframe(
    df: pd.DataFrame,
    normalize_arabic: bool = False,
    unify_digits: bool = False,
) -> tuple[pd.DataFrame, dict]:
    """
    Apply all cleaning steps to *df* and return the cleaned DataFrame plus a
    dict of statistics.

    Cleaning steps (in order):
      1. Clean column names (trim + dedupe).
      2. Normalise all string cells (trim whitespace, fix encoding artefacts).
      3. Remove completely empty rows.
      4. Remove duplicate rows.

    Args:
        df:               Input DataFrame (already loaded).
        normalize_arabic: Pass True to enable conservative Arabic normalisation.
        unify_digits:     Pass True to convert Arabic-Indic digits → 0–9.

    Returns:
        (cleaned_df, stats_dict) where stats_dict contains:
            rows_in, empty_rows_removed, duplicates_removed, columns_cleaned.
    """
    stats: dict = {}
    stats["rows_in"] = len(df)

    # --- Step 1: Clean column names ---
    new_cols, cols_cleaned = clean_column_names(df.columns)
    df = df.copy()
    df.columns = new_cols
    stats["columns_cleaned"] = cols_cleaned

    # --- Step 2: Normalise all string cells ---
    # pandas >= 2.1 deprecated applymap in favour of map; support both versions.
    def _map_fn(v: object) -> object:
        return _normalize_cell(v, normalize_arabic=normalize_arabic, unify_digits=unify_digits)

    if hasattr(df, "map") and callable(getattr(df.__class__, "map", None)):
        df = df.map(_map_fn)
    else:
        df = df.applymap(_map_fn)  # type: ignore[attr-defined]  # pandas < 2.1

    # --- Step 3: Remove completely empty rows ---
    before_empty = len(df)
    # A row is "empty" when every cell is NaN, None, or an empty string.
    df = df.replace("", pd.NA)
    df = df.dropna(how="all")
    stats["empty_rows_removed"] = before_empty - len(df)

    # --- Step 4: Remove duplicate rows ---
    before_dup = len(df)
    df = df.drop_duplicates()
    stats["duplicates_removed"] = before_dup - len(df)

    stats["rows_out"] = len(df)
    return df, stats


# ------------------------------------------------------------------
# File I/O helpers
# ------------------------------------------------------------------


def load_csv(path: str) -> tuple[pd.DataFrame, str]:
    """
    Load a CSV file, auto-detecting the best encoding.

    Args:
        path: Path to the input CSV file.

    Returns:
        A tuple (DataFrame, encoding_used).

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError:        If no supported encoding works.
    """
    import os

    if not os.path.isfile(path):
        raise FileNotFoundError(f"Input file not found: '{path}'")

    encoding = detect_encoding(path)
    df = pd.read_csv(path, encoding=encoding, dtype=str)
    return df, encoding


def save_csv(df: pd.DataFrame, path: str) -> None:
    """
    Save a DataFrame to a CSV file encoded as UTF-8-SIG.

    UTF-8-SIG adds a BOM so that Excel on Windows opens the file correctly
    and shows Arabic text without garbled characters.

    Args:
        df:   The DataFrame to save.
        path: Destination file path.
    """
    df.to_csv(path, index=False, encoding="utf-8-sig")


def clean_file(
    input_path: str,
    output_path: str,
    normalize_arabic: bool = False,
    unify_digits: bool = False,
) -> CleaningReport:
    """
    High-level function: load → clean → save and return a CleaningReport.

    This is the single entry-point used by both the CLI and the Streamlit app.

    Args:
        input_path:       Path to the input CSV file.
        output_path:      Path where the cleaned CSV will be written.
        normalize_arabic: Enable conservative Arabic letter normalisation.
        unify_digits:     Convert Arabic-Indic digits to Western digits.

    Returns:
        A populated CleaningReport instance.
    """
    # Load
    df, encoding = load_csv(input_path)

    # Clean
    cleaned_df, stats = clean_dataframe(df, normalize_arabic=normalize_arabic, unify_digits=unify_digits)

    # Save
    save_csv(cleaned_df, output_path)

    # Build report
    rpt = CleaningReport(
        rows_in=stats["rows_in"],
        rows_out=stats["rows_out"],
        empty_rows_removed=stats["empty_rows_removed"],
        duplicates_removed=stats["duplicates_removed"],
        columns_cleaned=stats["columns_cleaned"],
        encoding_used=encoding,
        columns=list(cleaned_df.columns),
    )
    return rpt
