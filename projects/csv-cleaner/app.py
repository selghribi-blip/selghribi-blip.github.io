"""
app.py — Streamlit UI for the Arabic/English CSV cleaner.

Run:
    streamlit run projects/csv-cleaner/app.py

Bilingual (Arabic first, then simple English below each label).
Arabic is displayed right-to-left; English left-to-right.
"""

from __future__ import annotations

import io
import os
import sys

import pandas as pd
import streamlit as st

# Add this directory to the path so sibling modules can be imported.
sys.path.insert(0, os.path.dirname(__file__))

from cleaner import clean_dataframe
from report import report_to_json, report_to_text, CleaningReport

# ------------------------------------------------------------------
# Page config
# ------------------------------------------------------------------

st.set_page_config(
    page_title="منظّف CSV | CSV Cleaner",
    page_icon="🧹",
    layout="centered",
)

# Inject minimal CSS: RTL for Arabic paragraphs; general styling.
st.markdown(
    """
    <style>
    .ar { direction: rtl; text-align: right; font-size: 1rem; }
    .en { direction: ltr; text-align: left; font-size: 0.85rem; color: #555; }
    .section-title { font-size: 1.1rem; font-weight: bold; margin-top: 1rem; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ------------------------------------------------------------------
# Header
# ------------------------------------------------------------------

st.title("🧹 منظّف CSV")
st.markdown("<p class='en'>Arabic / English CSV Cleaner</p>", unsafe_allow_html=True)
st.markdown("---")

# ------------------------------------------------------------------
# Step 1: Upload
# ------------------------------------------------------------------

st.markdown("<p class='section-title ar'>١. ارفع ملف CSV</p>", unsafe_allow_html=True)
st.markdown("<p class='en'>1. Upload a CSV file</p>", unsafe_allow_html=True)

uploaded = st.file_uploader(
    label="اختر ملف CSV | Choose a CSV file",
    type=["csv"],
    help="يجب أن يكون الملف بتنسيق CSV. | File must be in CSV format.",
)

if uploaded is None:
    st.info(
        "📂 لم يتم اختيار أي ملف بعد.\n\n"
        "No file selected yet — upload a CSV file above to start."
    )
    st.stop()

# ------------------------------------------------------------------
# Step 2: Options
# ------------------------------------------------------------------

st.markdown("---")
st.markdown("<p class='section-title ar'>٢. خيارات التنظيف</p>", unsafe_allow_html=True)
st.markdown("<p class='en'>2. Cleaning options</p>", unsafe_allow_html=True)

col1, col2 = st.columns(2)

with col1:
    normalize_arabic = st.checkbox(
        "توحيد الحروف العربية\nNormalise Arabic letters",
        value=False,
        help=(
            "يحوّل: أ إ آ → ا، ة → ه، ى → ي\n"
            "Converts: أ إ آ → ا, ة → ه, ى → ي"
        ),
    )

with col2:
    unify_digits = st.checkbox(
        "تحويل الأرقام الهندية\nUnify Arabic-Indic digits",
        value=False,
        help="يحوّل ٠١٢٣٤٥٦٧٨٩ إلى 0123456789\nConverts ٠١٢٣٤٥٦٧٨٩ to 0123456789",
    )

# ------------------------------------------------------------------
# Step 3: Preview raw data
# ------------------------------------------------------------------

st.markdown("---")
st.markdown("<p class='section-title ar'>٣. معاينة البيانات الأصلية</p>", unsafe_allow_html=True)
st.markdown("<p class='en'>3. Preview original data</p>", unsafe_allow_html=True)

# Detect encoding from raw bytes.
raw_bytes = uploaded.read()

encoding_used = "utf-8"
for enc in ["utf-8-sig", "utf-8", "cp1256", "latin1"]:
    try:
        raw_bytes.decode(enc)
        encoding_used = enc
        break
    except (UnicodeDecodeError, LookupError):
        continue

try:
    raw_df = pd.read_csv(io.BytesIO(raw_bytes), encoding=encoding_used, dtype=str)
except Exception as exc:
    st.error(f"❌ فشل قراءة الملف | Failed to read file: {exc}")
    st.stop()

st.caption(f"الترميز المكتشف | Detected encoding: **{encoding_used}**")
st.dataframe(raw_df.head(20), use_container_width=True)
st.caption(
    f"إجمالي الصفوف: {len(raw_df)} | Total rows: {len(raw_df)}"
    f" — الأعمدة: {len(raw_df.columns)} | Columns: {len(raw_df.columns)}"
)

# ------------------------------------------------------------------
# Step 4: Clean
# ------------------------------------------------------------------

st.markdown("---")
st.markdown("<p class='section-title ar'>٤. تنظيف البيانات</p>", unsafe_allow_html=True)
st.markdown("<p class='en'>4. Clean the data</p>", unsafe_allow_html=True)

if st.button("🧹 تنظيف الملف\nClean file", use_container_width=True):
    with st.spinner("جارٍ التنظيف... | Cleaning in progress..."):
        cleaned_df, stats = clean_dataframe(
            raw_df,
            normalize_arabic=normalize_arabic,
            unify_digits=unify_digits,
        )

    report = CleaningReport(
        rows_in=stats["rows_in"],
        rows_out=stats["rows_out"],
        empty_rows_removed=stats["empty_rows_removed"],
        duplicates_removed=stats["duplicates_removed"],
        columns_cleaned=stats["columns_cleaned"],
        encoding_used=encoding_used,
        columns=list(cleaned_df.columns),
    )

    st.success("✅ تم التنظيف بنجاح!\nCleaned successfully!")

    # --- Cleaned preview ---
    st.markdown(
        "<p class='section-title ar'>معاينة البيانات المنظَّفة</p>",
        unsafe_allow_html=True,
    )
    st.markdown("<p class='en'>Preview of cleaned data</p>", unsafe_allow_html=True)
    st.dataframe(cleaned_df.head(20), use_container_width=True)
    st.caption(
        f"الصفوف بعد التنظيف: {report.rows_out} | Rows after cleaning: {report.rows_out}"
    )

    # --- Report ---
    st.markdown("---")
    st.markdown(
        "<p class='section-title ar'>٥. تقرير التنظيف</p>",
        unsafe_allow_html=True,
    )
    st.markdown("<p class='en'>5. Cleaning report</p>", unsafe_allow_html=True)

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("صفوف الإدخال\nRows in", report.rows_in)
    c2.metric("صفوف فارغة محذوفة\nEmpty removed", report.empty_rows_removed)
    c3.metric("تكرارات محذوفة\nDuplicates removed", report.duplicates_removed)
    c4.metric("صفوف الإخراج\nRows out", report.rows_out)

    with st.expander("عرض تقرير نصي | View text report"):
        st.text(report_to_text(report))

    with st.expander("عرض تقرير JSON | View JSON report"):
        st.code(report_to_json(report), language="json")

    # --- Downloads ---
    st.markdown("---")
    st.markdown(
        "<p class='section-title ar'>٦. تنزيل الملفات</p>",
        unsafe_allow_html=True,
    )
    st.markdown("<p class='en'>6. Download files</p>", unsafe_allow_html=True)

    # CSV — encoded UTF-8-SIG so Excel on Windows shows Arabic correctly.
    csv_bytes = cleaned_df.to_csv(index=False, encoding="utf-8-sig").encode("utf-8-sig")
    original_name = uploaded.name.rsplit(".", 1)[0]

    col_a, col_b, col_c = st.columns(3)

    with col_a:
        st.download_button(
            label="⬇️ تنزيل CSV\nDownload CSV",
            data=csv_bytes,
            file_name=f"{original_name}_cleaned.csv",
            mime="text/csv",
            use_container_width=True,
        )

    with col_b:
        st.download_button(
            label="⬇️ تنزيل التقرير (JSON)\nDownload report (JSON)",
            data=report_to_json(report).encode("utf-8"),
            file_name=f"{original_name}_cleaned.report.json",
            mime="application/json",
            use_container_width=True,
        )

    with col_c:
        st.download_button(
            label="⬇️ تنزيل التقرير (TXT)\nDownload report (TXT)",
            data=report_to_text(report).encode("utf-8"),
            file_name=f"{original_name}_cleaned.report.txt",
            mime="text/plain",
            use_container_width=True,
        )
