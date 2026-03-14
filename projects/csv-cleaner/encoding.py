"""
encoding.py — Encoding detection helpers for Arabic/English CSV files.

Tries common encodings in order and returns the first one that works
without raising a UnicodeDecodeError.
"""

from __future__ import annotations

# Encodings to try, in priority order.
# UTF-8-SIG  : UTF-8 with BOM (common from Excel).
# UTF-8      : Standard UTF-8.
# cp1256     : Windows Arabic code page.
# latin1     : Fallback that never raises (accepts any byte).
CANDIDATE_ENCODINGS: list[str] = ["utf-8-sig", "utf-8", "cp1256", "latin1"]


def detect_encoding(path: str) -> str:
    """
    Try to read the file at *path* with each encoding in CANDIDATE_ENCODINGS.
    Return the first encoding that succeeds without errors.

    Args:
        path: Absolute or relative path to the CSV file.

    Returns:
        The name of the working encoding (e.g. 'utf-8-sig').

    Raises:
        ValueError: If the file cannot be read with any known encoding.
    """
    for enc in CANDIDATE_ENCODINGS:
        try:
            with open(path, encoding=enc, errors="strict") as fh:
                fh.read()
            return enc
        except (UnicodeDecodeError, LookupError):
            # This encoding didn't work; try the next one.
            continue

    # latin1 should never reach here, but raise a clear error just in case.
    raise ValueError(
        f"Cannot read '{path}' with any of the supported encodings: "
        + ", ".join(CANDIDATE_ENCODINGS)
    )
