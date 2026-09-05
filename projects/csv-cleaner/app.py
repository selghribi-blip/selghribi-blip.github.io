"""
أداة تنظيف ملفات CSV/Excel | CSV/Excel Data Cleaner Tool
Streamlit app — bilingual UI (Arabic RTL + English LTR)
"""

import io
import streamlit as st
import pandas as pd

# ──────────────────────────────────────────────
# إعداد الصفحة | Page configuration
# ──────────────────────────────────────────────
st.set_page_config(
    page_title="منظّف CSV/Excel | CSV/Excel Cleaner",
    page_icon="🧹",
    layout="wide",
)

# ──────────────────────────────────────────────
# CSS: RTL for Arabic, LTR for English subtitles
# ──────────────────────────────────────────────
st.markdown(
    """
    <style>
    /* Direction & font for the whole app */
    html, body, [class*="css"] {
        direction: rtl;
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    }

    /* English sub-lines stay LTR */
    .en {
        direction: ltr;
        display: block;
        font-size: 0.82em;
        color: #6c757d;
        margin-top: 2px;
        font-style: italic;
    }

    /* Section headings */
    .bilingual-title {
        direction: rtl;
        font-size: 1.05rem;
        font-weight: 600;
        color: #1a3a5c;
        margin-bottom: 0;
    }

    /* DataFrames: keep them LTR so columns look right */
    .stDataFrame, .stDataFrame * {
        direction: ltr !important;
        text-align: left !important;
    }

    /* Download button alignment fix */
    .stDownloadButton > button {
        width: 100%;
    }

    /* Metrics */
    [data-testid="metric-container"] {
        direction: rtl;
        text-align: right;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ──────────────────────────────────────────────
# Helper: bilingual label
# ──────────────────────────────────────────────
def bilingual(ar: str, en: str) -> str:
    """Return HTML with Arabic line then English sub-line."""
    return f'<p class="bilingual-title">{ar}<span class="en">{en}</span></p>'


# ──────────────────────────────────────────────
# عنوان التطبيق | App title
# ──────────────────────────────────────────────
st.markdown(
    bilingual("🧹 منظّف ملفات CSV / Excel", "CSV / Excel Data Cleaner"),
    unsafe_allow_html=True,
)
st.markdown(
    bilingual(
        "ارفع ملفك، اختر خيارات التنظيف، ثم حمّل الملف المنظّف.",
        "Upload your file, choose cleaning options, then download the clean file.",
    ),
    unsafe_allow_html=True,
)
st.divider()

# ──────────────────────────────────────────────
# رفع الملف | File upload
# ──────────────────────────────────────────────
st.markdown(
    bilingual("📂 رفع الملف", "Upload File"),
    unsafe_allow_html=True,
)

uploaded_file = st.file_uploader(
    label="",
    type=["csv", "xlsx", "xls"],
    help="يدعم: CSV, XLSX, XLS  |  Supports: CSV, XLSX, XLS",
)

if uploaded_file is None:
    st.info(
        "📌 ارفع ملف CSV أو Excel للبدء.\n\nUpload a CSV or Excel file to get started."
    )
    st.stop()

# ──────────────────────────────────────────────
# قراءة الملف | Read file
# ──────────────────────────────────────────────
@st.cache_data(show_spinner=False)
def read_file(file_bytes: bytes, file_name: str) -> pd.DataFrame:
    if file_name.lower().endswith(".csv"):
        return pd.read_csv(io.BytesIO(file_bytes))
    return pd.read_excel(io.BytesIO(file_bytes))


try:
    file_bytes = uploaded_file.read()
    df_original = read_file(file_bytes, uploaded_file.name)
except Exception as exc:
    st.error(f"❌ تعذّر قراءة الملف | Could not read file: {exc}")
    st.stop()

# ──────────────────────────────────────────────
# معاينة قبل التنظيف | Preview before cleaning
# ──────────────────────────────────────────────
st.markdown(
    bilingual("👁️ معاينة الملف الأصلي", "Preview — Original File"),
    unsafe_allow_html=True,
)
st.markdown(
    bilingual(
        f"إجمالي الصفوف: **{len(df_original):,}**  |  الأعمدة: **{len(df_original.columns)}**",
        f"Total rows: {len(df_original):,}  |  Columns: {len(df_original.columns)}",
    ),
    unsafe_allow_html=True,
)
st.dataframe(df_original.head(20), use_container_width=True)
st.divider()

# ──────────────────────────────────────────────
# خيارات التنظيف | Cleaning options
# ──────────────────────────────────────────────
st.markdown(
    bilingual("⚙️ خيارات التنظيف", "Cleaning Options"),
    unsafe_allow_html=True,
)

col1, col2, col3 = st.columns(3)

with col1:
    opt_empty_rows = st.checkbox(
        "حذف الصفوف الفارغة\nRemove empty rows",
        value=True,
        key="empty_rows",
    )
    opt_duplicates = st.checkbox(
        "حذف الصفوف المكررة\nRemove duplicate rows",
        value=True,
        key="duplicates",
    )

with col2:
    opt_trim = st.checkbox(
        "قصّ المسافات الزائدة\nTrim extra spaces",
        value=True,
        key="trim",
    )
    opt_lower_headers = st.checkbox(
        "توحيد أسماء الأعمدة (أحرف صغيرة)\nLowercase column names",
        value=False,
        key="lower_headers",
    )

with col3:
    opt_empty_cols = st.checkbox(
        "حذف الأعمدة الفارغة كلياً\nRemove fully-empty columns",
        value=True,
        key="empty_cols",
    )
    opt_fix_types = st.checkbox(
        "محاولة إصلاح أنواع الأعمدة (أرقام/تواريخ)\nAuto-fix column types (numbers/dates)",
        value=False,
        key="fix_types",
    )

st.divider()

# ──────────────────────────────────────────────
# تنفيذ التنظيف | Run cleaning
# ──────────────────────────────────────────────
st.markdown(
    bilingual("🚀 تنظيف الملف", "Clean File"),
    unsafe_allow_html=True,
)

clean_btn = st.button(
    "🧹 تنظيف الملف الآن\nClean file now",
    type="primary",
    use_container_width=True,
)

if clean_btn:
    df = df_original.copy()
    report_lines_ar: list[str] = []
    report_lines_en: list[str] = []

    rows_before = len(df)

    # 1. حذف الأعمدة الفارغة كلياً
    if opt_empty_cols:
        before = df.shape[1]
        df.dropna(axis=1, how="all", inplace=True)
        removed_cols = before - df.shape[1]
        if removed_cols:
            report_lines_ar.append(f"• تم حذف {removed_cols} عمود فارغ.")
            report_lines_en.append(f"• Removed {removed_cols} fully-empty column(s).")

    # 2. حذف الصفوف الفارغة
    if opt_empty_rows:
        before = len(df)
        df.dropna(how="all", inplace=True)
        removed = before - len(df)
        if removed:
            report_lines_ar.append(f"• تم حذف {removed} صف فارغ.")
            report_lines_en.append(f"• Removed {removed} empty row(s).")

    # 3. قصّ المسافات
    if opt_trim:
        str_cols = df.select_dtypes(include="object").columns
        df[str_cols] = df[str_cols].apply(
            lambda col: col.str.strip() if col.dtype == object else col
        )
        # Replace empty strings with NaN after trimming
        df[str_cols] = df[str_cols].replace("", pd.NA)
        report_lines_ar.append("• تم قصّ المسافات الزائدة في الأعمدة النصية.")
        report_lines_en.append("• Trimmed extra spaces in text columns.")

    # 4. حذف التكرارات
    if opt_duplicates:
        before = len(df)
        df.drop_duplicates(inplace=True)
        removed = before - len(df)
        if removed:
            report_lines_ar.append(f"• تم حذف {removed} صف مكرر.")
            report_lines_en.append(f"• Removed {removed} duplicate row(s).")

    # 5. توحيد أسماء الأعمدة
    if opt_lower_headers:
        df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
        report_lines_ar.append("• تم توحيد أسماء الأعمدة (أحرف صغيرة، بدون مسافات).")
        report_lines_en.append("• Column names normalized (lowercase, underscores).")

    # 6. إصلاح أنواع الأعمدة
    if opt_fix_types:
        for col in df.columns:
            original_non_na = df[col].notna().sum()
            if original_non_na == 0:
                continue
            # Try numeric
            converted = pd.to_numeric(df[col], errors="coerce")
            if converted.notna().sum() >= original_non_na * 0.8:
                df[col] = converted
                continue
            # Try datetime
            try:
                converted_dt = pd.to_datetime(df[col], errors="coerce")
                if converted_dt.notna().sum() >= original_non_na * 0.8:
                    df[col] = converted_dt
            except Exception:
                pass
        report_lines_ar.append("• تمت محاولة إصلاح أنواع بيانات الأعمدة.")
        report_lines_en.append("• Attempted auto-fix of column data types.")

    rows_after = len(df)
    rows_removed_total = rows_before - rows_after

    # ── نتائج إجمالية | Summary metrics ──
    st.markdown(
        bilingual("📊 ملخّص التنظيف", "Cleaning Summary"),
        unsafe_allow_html=True,
    )
    m1, m2, m3 = st.columns(3)
    m1.metric(
        label="الصفوف قبل | Rows before",
        value=f"{rows_before:,}",
    )
    m2.metric(
        label="الصفوف بعد | Rows after",
        value=f"{rows_after:,}",
        delta=f"-{rows_removed_total:,}" if rows_removed_total else "0",
        delta_color="inverse",
    )
    m3.metric(
        label="الأعمدة | Columns",
        value=f"{len(df.columns)}",
    )

    # ── تقرير التغييرات | Change report ──
    if report_lines_ar:
        st.markdown(
            bilingual("📋 تقرير التغييرات", "Change Report"),
            unsafe_allow_html=True,
        )
        for ar_line, en_line in zip(report_lines_ar, report_lines_en):
            st.markdown(
                f'<p style="margin:4px 0;">{ar_line}<span class="en">{en_line}</span></p>',
                unsafe_allow_html=True,
            )
    else:
        st.success(
            "✅ الملف نظيف — لم يتم إجراء أي تغييرات.\n\nFile is clean — no changes were made."
        )

    st.divider()

    # ── معاينة بعد التنظيف | Preview after cleaning ──
    st.markdown(
        bilingual("👁️ معاينة الملف المنظّف", "Preview — Cleaned File"),
        unsafe_allow_html=True,
    )
    st.dataframe(df.head(20), use_container_width=True)
    st.divider()

    # ── تحميل الملف | Download ──
    st.markdown(
        bilingual("⬇️ تحميل الملف المنظّف", "Download Cleaned File"),
        unsafe_allow_html=True,
    )

    dl_col1, dl_col2 = st.columns(2)

    # CSV download
    csv_bytes = df.to_csv(index=False).encode("utf-8-sig")
    dl_col1.download_button(
        label="⬇️ تحميل CSV\nDownload as CSV",
        data=csv_bytes,
        file_name="cleaned_data.csv",
        mime="text/csv",
        use_container_width=True,
    )

    # Excel download
    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Cleaned")
    excel_bytes = excel_buffer.getvalue()
    dl_col2.download_button(
        label="⬇️ تحميل Excel\nDownload as Excel",
        data=excel_bytes,
        file_name="cleaned_data.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        use_container_width=True,
    )

    st.success(
        "✅ جاهز للتحميل!\n\nReady to download!"
    )

# ──────────────────────────────────────────────
# تذييل | Footer
# ──────────────────────────────────────────────
st.divider()
st.markdown(
    bilingual(
        "صُنع بـ ❤️ في المغرب — GitHub Student Developer Pack",
        "Made with ❤️ in Morocco — GitHub Student Developer Pack",
    ),
    unsafe_allow_html=True,
)
