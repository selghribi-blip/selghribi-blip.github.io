"""
CSV / Excel Data Cleaner — Streamlit MVP
تنظيف ملفات CSV وExcel بسهولة

Usage / الاستخدام:
    streamlit run app.py
"""

import io
import re
from datetime import datetime

import pandas as pd
import streamlit as st

# ── Page config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="CSV/Excel Cleaner | منظف البيانات",
    page_icon="🧹",
    layout="wide",
)

# ── Helpers ────────────────────────────────────────────────────────────────────

def _try_fix_dates(series: pd.Series) -> pd.Series:
    """Try to parse a column as dates; return original series on failure."""
    try:
        converted = pd.to_datetime(series, errors="coerce")
        # Only apply if at least half the non-null values were parsed successfully
        success_rate = converted.notna().sum() / max(series.notna().sum(), 1)
        if success_rate >= 0.5:
            return converted.dt.strftime("%Y-%m-%d").where(converted.notna(), other=series)
    except Exception:
        pass
    return series


def _try_fix_numbers(series: pd.Series) -> pd.Series:
    """Strip common currency/thousand-separator chars and coerce to numeric."""
    cleaned = series.astype(str).str.replace(r"[,،\s$€£¥₹]", "", regex=True)
    numeric = pd.to_numeric(cleaned, errors="coerce")
    success_rate = numeric.notna().sum() / max(series.notna().sum(), 1)
    if success_rate >= 0.5:
        return numeric
    return series


def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Apply all cleaning steps and return (cleaned_df, report_dict).
    Steps:
        1. Strip leading/trailing spaces from string columns
        2. Remove fully empty rows
        3. Remove duplicate rows
        4. Attempt date & number fixes on object columns
    """
    report: dict = {}
    original_rows = len(df)

    # 1. Trim spaces
    str_cols = df.select_dtypes(include="object").columns
    for col in str_cols:
        df[col] = df[col].str.strip()
    # Treat empty strings as NaN so fully-empty rows are caught below
    df.replace("", pd.NA, inplace=True)
    report["trim_columns"] = list(str_cols)

    # 2. Remove fully empty rows
    before = len(df)
    df = df.dropna(how="all")
    report["empty_rows_removed"] = before - len(df)

    # 3. Remove duplicates
    before = len(df)
    df = df.drop_duplicates()
    report["duplicates_removed"] = before - len(df)

    # 4. Fix dates / numbers (object columns only)
    fixed_dates: list[str] = []
    fixed_numbers: list[str] = []
    for col in df.select_dtypes(include="object").columns:
        fixed = _try_fix_dates(df[col])
        if not fixed.equals(df[col]):
            df[col] = fixed
            fixed_dates.append(col)
            continue
        fixed2 = _try_fix_numbers(df[col])
        if not fixed2.equals(df[col]):
            df[col] = fixed2
            fixed_numbers.append(col)

    report["date_columns_fixed"] = fixed_dates
    report["number_columns_fixed"] = fixed_numbers
    report["original_rows"] = original_rows
    report["final_rows"] = len(df)
    report["total_rows_removed"] = original_rows - len(df)
    report["columns"] = list(df.columns)
    return df, report


def build_text_report(report: dict, filename: str) -> str:
    """Generate a human-readable cleaning report."""
    lines = [
        "=" * 50,
        f"📊 تقرير التنظيف | Cleaning Report",
        f"الملف / File: {filename}",
        f"التاريخ / Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "=" * 50,
        f"الصفوف الأصلية / Original rows : {report['original_rows']}",
        f"الصفوف النهائية / Final rows    : {report['final_rows']}",
        f"إجمالي المحذوف / Total removed  : {report['total_rows_removed']}",
        "-" * 50,
        f"صفوف فارغة محذوفة / Empty rows removed   : {report['empty_rows_removed']}",
        f"تكرارات محذوفة / Duplicates removed       : {report['duplicates_removed']}",
        "-" * 50,
        f"أعمدة تم trim spaces : {', '.join(report['trim_columns']) or 'لا شيء'}",
        f"أعمدة تم إصلاح تواريخها / Dates fixed   : {', '.join(report['date_columns_fixed']) or 'لا شيء'}",
        f"أعمدة تم إصلاح أرقامها / Numbers fixed  : {', '.join(report['number_columns_fixed']) or 'لا شيء'}",
        "=" * 50,
    ]
    return "\n".join(lines)


# ── UI ─────────────────────────────────────────────────────────────────────────

st.title("🧹 CSV / Excel Data Cleaner")
st.markdown(
    """
**أداة تنظيف ملفات البيانات | Data Cleaning Tool**

ارفع ملف CSV أو Excel، اضغط "تنظيف"، ثم حمّل الملف النظيف.  
*Upload a CSV or Excel file, click "Clean", then download the cleaned file.*

> ⚠️ **تحذير / Warning:** لا ترفع بيانات حساسة (كلمات مرور، بطاقات ائتمان، بيانات شخصية).  
> *Do NOT upload sensitive data (passwords, credit cards, personal IDs).*
""",
    unsafe_allow_html=False,
)

st.divider()

# ── Upload ─────────────────────────────────────────────────────────────────────
uploaded = st.file_uploader(
    "📁 اختر ملف CSV أو XLSX | Choose CSV or XLSX file",
    type=["csv", "xlsx", "xls"],
    help="الحجم الأقصى 200 MB / Max size 200 MB",
)

if uploaded is not None:
    # Read file
    try:
        if uploaded.name.lower().endswith((".xlsx", ".xls")):
            df_raw = pd.read_excel(uploaded, engine="openpyxl")
        else:
            # Try common encodings
            try:
                df_raw = pd.read_csv(uploaded, encoding="utf-8")
            except UnicodeDecodeError:
                uploaded.seek(0)
                df_raw = pd.read_csv(uploaded, encoding="latin-1")
    except Exception as exc:
        st.error(f"❌ خطأ في قراءة الملف / Error reading file: {exc}")
        st.stop()

    st.success(f"✅ تم تحميل الملف: **{uploaded.name}** — {len(df_raw):,} صف × {len(df_raw.columns)} عمود")

    # ── Preview BEFORE ─────────────────────────────────────────────────────────
    with st.expander("👁️ معاينة قبل التنظيف | Preview BEFORE cleaning (first 20 rows)", expanded=True):
        st.dataframe(df_raw.head(20), use_container_width=True)

    st.divider()

    # ── Clean button ───────────────────────────────────────────────────────────
    if st.button("🧹 تنظيف الآن | Clean Now", type="primary", use_container_width=True):
        with st.spinner("جارٍ التنظيف... / Cleaning in progress..."):
            df_clean, report = clean_dataframe(df_raw.copy())

        st.success("✅ اكتمل التنظيف! / Cleaning complete!")

        # ── Preview AFTER ──────────────────────────────────────────────────────
        with st.expander("✨ معاينة بعد التنظيف | Preview AFTER cleaning (first 20 rows)", expanded=True):
            st.dataframe(df_clean.head(20), use_container_width=True)

        # ── Report ─────────────────────────────────────────────────────────────
        st.subheader("📊 تقرير التنظيف | Cleaning Report")
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("الصفوف الأصلية\nOriginal rows", f"{report['original_rows']:,}")
        col2.metric("الصفوف النهائية\nFinal rows", f"{report['final_rows']:,}")
        col3.metric("صفوف فارغة محذوفة\nEmpty rows removed", f"{report['empty_rows_removed']:,}")
        col4.metric("تكرارات محذوفة\nDuplicates removed", f"{report['duplicates_removed']:,}")

        text_report = build_text_report(report, uploaded.name)
        with st.expander("📄 التقرير التفصيلي | Full text report"):
            st.code(text_report, language="text")

        st.divider()

        # ── Downloads ──────────────────────────────────────────────────────────
        st.subheader("⬇️ تنزيل الملفات | Download Files")
        dl_col1, dl_col2 = st.columns(2)

        # Download cleaned CSV
        csv_bytes = df_clean.to_csv(index=False, encoding="utf-8-sig").encode("utf-8-sig")
        stem = re.sub(r"\.[^.]+$", "", uploaded.name)
        dl_col1.download_button(
            label="⬇️ تنزيل CSV المنظَّف | Download Cleaned CSV",
            data=csv_bytes,
            file_name=f"{stem}_cleaned.csv",
            mime="text/csv",
            use_container_width=True,
        )

        # Download report TXT
        report_bytes = text_report.encode("utf-8")
        dl_col2.download_button(
            label="📄 تنزيل التقرير | Download Report (.txt)",
            data=report_bytes,
            file_name=f"{stem}_report.txt",
            mime="text/plain",
            use_container_width=True,
        )

else:
    st.info("⬆️ ارفع ملفًا للبدء | Upload a file to get started")

# ── Footer ─────────────────────────────────────────────────────────────────────
st.divider()
st.markdown(
    """
<div style="text-align:center; color:#888; font-size:0.85rem;">
    🧹 CSV/Excel Cleaner &nbsp;|&nbsp;
    بُني بـ Python + Streamlit &nbsp;|&nbsp;
    <a href="https://selghribi-blip.github.io/pages/csv-cleaner" target="_blank">الصفحة التسويقية</a>
    &nbsp;|&nbsp;
    للاستخدام الشخصي والتجاري — راجع الترخيص
</div>
""",
    unsafe_allow_html=True,
)
