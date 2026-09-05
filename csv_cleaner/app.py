"""
أداة تنظيف ملفات CSV و Excel | CSV & Excel Data Cleaner
تطبيق Streamlit ثنائي اللغة (عربي + English)
Bilingual Streamlit app (Arabic + English)
"""

import io
import streamlit as st
import pandas as pd

# ─── إعداد الصفحة | Page setup ───────────────────────────────────────────────
st.set_page_config(
    page_title="منظّف البيانات | Data Cleaner",
    page_icon="🧹",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── CSS — دعم RTL + تنسيق ثنائي اللغة | RTL support + bilingual style ───────
st.markdown(
    """
    <style>
    /* Force RTL for the whole app */
    html, body, [class*="css"] {
        direction: rtl;
        text-align: right;
        font-family: 'Segoe UI', Tahoma, 'Arabic Typesetting', sans-serif;
    }
    /* Main heading Arabic */
    .main-title-ar {
        font-size: 2.2rem;
        font-weight: 800;
        color: #1a3a5c;
        line-height: 1.3;
    }
    /* Sub-heading English */
    .main-title-en {
        font-size: 1rem;
        color: #5a5a5a;
        font-style: italic;
        direction: ltr;
        text-align: left;
    }
    /* Section title */
    .section-title-ar {
        font-size: 1.15rem;
        font-weight: 700;
        color: #1a3a5c;
        margin-bottom: 2px;
    }
    .section-title-en {
        font-size: 0.82rem;
        color: #888;
        direction: ltr;
        text-align: left;
        margin-bottom: 10px;
    }
    /* Info box */
    .info-box {
        background: #f0f4ff;
        border-right: 4px solid #1a3a5c;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
    }
    /* Success box */
    .success-box {
        background: #e8f5e9;
        border-right: 4px solid #2e7d32;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
    }
    /* Report box */
    .report-box {
        background: #fafafa;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        font-size: 0.9rem;
    }
    /* Left-align numbers/English inside RTL containers */
    .ltr-text {
        direction: ltr;
        display: inline-block;
    }
    /* Sidebar English labels */
    .sidebar-label-en {
        font-size: 0.78rem;
        color: #aaa;
        direction: ltr;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ─── رأس الصفحة | Page header ─────────────────────────────────────────────────
st.markdown(
    """
    <div class="main-title-ar">🧹 منظّف ملفات CSV و Excel</div>
    <div class="main-title-en">CSV &amp; Excel Data Cleaner — Upload, clean, download in seconds</div>
    <hr style="margin: 12px 0 24px 0; border-color: #e0e0e0;" />
    """,
    unsafe_allow_html=True,
)

# ─── الشريط الجانبي | Sidebar ─────────────────────────────────────────────────
with st.sidebar:
    st.markdown(
        """
        <div class="section-title-ar">⚙️ خيارات التنظيف</div>
        <div class="section-title-en">Cleaning options</div>
        """,
        unsafe_allow_html=True,
    )

    opt_empty_rows = st.checkbox(
        "حذف الصفوف الفارغة\n\nRemove empty rows",
        value=True,
        help="يحذف الصفوف التي جميع خلاياها فارغة | Remove rows where all cells are empty",
    )
    opt_trim = st.checkbox(
        "قص المسافات الزائدة\n\nTrim extra spaces",
        value=True,
        help="يزيل المسافات من بداية ونهاية النص | Remove leading/trailing spaces",
    )
    opt_duplicates = st.checkbox(
        "حذف الصفوف المكررة\n\nRemove duplicate rows",
        value=True,
        help="يحذف الصفوف المتطابقة تمامًا | Remove completely identical rows",
    )
    opt_empty_cols = st.checkbox(
        "حذف الأعمدة الفارغة كليًا\n\nRemove fully empty columns",
        value=False,
        help="يحذف الأعمدة التي جميع قيمها فارغة | Remove columns where all values are empty",
    )
    opt_fix_numbers = st.checkbox(
        "تنظيف أعمدة الأرقام\n\nClean numeric columns",
        value=False,
        help="يزيل الفراغات والرموز من الخلايا الرقمية | Strip spaces/symbols from numeric-looking cells",
    )

    st.markdown("---")
    st.markdown(
        """
        <div class="section-title-ar">📥 تنسيق التصدير</div>
        <div class="section-title-en">Export format</div>
        """,
        unsafe_allow_html=True,
    )
    export_format = st.radio(
        label="",
        options=["CSV", "Excel (.xlsx)"],
        index=0,
    )

    st.markdown("---")
    st.markdown(
        """
        <div style="font-size:0.8rem; color:#888; direction:ltr; text-align:left;">
        🔒 Your data stays local. Nothing is sent to any server.
        <br>بياناتك تبقى محلية. لا يُرسل أي شيء للإنترنت.
        </div>
        """,
        unsafe_allow_html=True,
    )

# ─── رفع الملف | File upload ───────────────────────────────────────────────────
st.markdown(
    """
    <div class="section-title-ar">📂 رفع الملف</div>
    <div class="section-title-en">Upload your file</div>
    """,
    unsafe_allow_html=True,
)

uploaded_file = st.file_uploader(
    label="اختر ملف CSV أو Excel | Choose a CSV or Excel file",
    type=["csv", "xlsx", "xls"],
    help="الصيغ المدعومة: .csv, .xlsx, .xls | Supported formats: .csv, .xlsx, .xls",
)

if uploaded_file is None:
    st.markdown(
        """
        <div class="info-box">
            <strong>كيف يعمل التطبيق؟ | How it works</strong><br>
            ١. ارفع ملفك (CSV أو Excel) — <span class="ltr-text">1. Upload your CSV or Excel file</span><br>
            ٢. اختر خيارات التنظيف من الشريط الجانبي — <span class="ltr-text">2. Pick cleaning options in the sidebar</span><br>
            ٣. شاهد المعاينة وتقرير التغييرات — <span class="ltr-text">3. Preview results and change report</span><br>
            ٤. حمّل الملف المنظّف — <span class="ltr-text">4. Download the clean file</span>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.stop()

# ─── قراءة الملف | Read file ───────────────────────────────────────────────────
try:
    if uploaded_file.name.endswith(".csv"):
        df_raw = pd.read_csv(uploaded_file)
    else:
        df_raw = pd.read_excel(uploaded_file)
except Exception as exc:
    st.error(f"⚠️ تعذّر قراءة الملف | Could not read file: {exc}")
    st.stop()

df = df_raw.copy()
report_lines = []  # سيحمل تقرير التغييرات | will hold change report lines

# ─── تطبيق خيارات التنظيف | Apply cleaning options ───────────────────────────
rows_before = len(df)
cols_before = len(df.columns)

if opt_empty_rows:
    before = len(df)
    df = df.dropna(how="all")
    removed = before - len(df)
    report_lines.append(
        f"✅ حذف الصفوف الفارغة (Remove empty rows): **{removed}** صف | row(s)"
    )

if opt_trim:
    str_cols = df.select_dtypes(include="object").columns
    for col in str_cols:
        df[col] = df[col].str.strip()
    report_lines.append(
        f"✅ قص المسافات (Trim spaces): تم في **{len(str_cols)}** عمود | column(s)"
    )

if opt_duplicates:
    before = len(df)
    df = df.drop_duplicates()
    removed = before - len(df)
    report_lines.append(
        f"✅ حذف المكررات (Remove duplicates): **{removed}** صف | row(s)"
    )

if opt_empty_cols:
    before = len(df.columns)
    df = df.dropna(axis=1, how="all")
    removed = before - len(df.columns)
    report_lines.append(
        f"✅ حذف الأعمدة الفارغة (Remove empty columns): **{removed}** عمود | column(s)"
    )

if opt_fix_numbers:
    # A column is treated as numeric if ≥50% of its non-null values look like numbers
    NUMERIC_COLUMN_THRESHOLD = 0.5
    for col in df.columns:
        if df[col].dtype == object:
            # Strip characters that are not digits, dot, or leading minus sign
            cleaned = df[col].str.replace(r"[^\d.\-]", "", regex=True)
            numeric_attempt = pd.to_numeric(cleaned, errors="coerce")
            if numeric_attempt.notna().sum() > len(df) * NUMERIC_COLUMN_THRESHOLD:
                df[col] = numeric_attempt
    report_lines.append("✅ تنظيف الأرقام (Clean numeric columns): تم | done")

rows_after = len(df)
cols_after = len(df.columns)

# ─── ملخص التغييرات | Change summary ──────────────────────────────────────────
col_stat1, col_stat2, col_stat3, col_stat4 = st.columns(4)
col_stat1.metric(
    label="الصفوف قبل | Rows before",
    value=f"{rows_before:,}",
)
col_stat2.metric(
    label="الصفوف بعد | Rows after",
    value=f"{rows_after:,}",
    delta=f"{rows_after - rows_before:+,}",
    delta_color="inverse",
)
col_stat3.metric(
    label="الأعمدة قبل | Cols before",
    value=f"{cols_before:,}",
)
col_stat4.metric(
    label="الأعمدة بعد | Cols after",
    value=f"{cols_after:,}",
    delta=f"{cols_after - cols_before:+,}",
    delta_color="inverse",
)

st.markdown("<br>", unsafe_allow_html=True)

# ─── تقرير التغييرات | Change report ──────────────────────────────────────────
if report_lines:
    st.markdown(
        """
        <div class="section-title-ar">📋 تقرير التغييرات</div>
        <div class="section-title-en">Change report</div>
        """,
        unsafe_allow_html=True,
    )
    for line in report_lines:
        st.markdown(f"- {line}")
    st.markdown("<br>", unsafe_allow_html=True)

# ─── معاينة البيانات | Data preview ───────────────────────────────────────────
tab_before, tab_after = st.tabs(
    [
        "🔴 البيانات الأصلية | Original data",
        "🟢 البيانات المنظّفة | Cleaned data",
    ]
)
with tab_before:
    st.markdown(
        f"<div class='section-title-en'>Showing first 20 rows of {len(df_raw):,} total</div>",
        unsafe_allow_html=True,
    )
    st.dataframe(df_raw.head(20), use_container_width=True)

with tab_after:
    st.markdown(
        f"<div class='section-title-en'>Showing first 20 rows of {len(df):,} total</div>",
        unsafe_allow_html=True,
    )
    st.dataframe(df.head(20), use_container_width=True)

st.markdown("<br>", unsafe_allow_html=True)

# ─── تحميل الملف المنظّف | Download cleaned file ──────────────────────────────
st.markdown(
    """
    <div class="section-title-ar">⬇️ تحميل الملف المنظّف</div>
    <div class="section-title-en">Download the cleaned file</div>
    """,
    unsafe_allow_html=True,
)

base_name = uploaded_file.name.rsplit(".", 1)[0]

if export_format == "CSV":
    out_bytes = df.to_csv(index=False).encode("utf-8-sig")
    out_name = f"{base_name}_cleaned.csv"
    mime = "text/csv"
else:
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    out_bytes = buffer.getvalue()
    out_name = f"{base_name}_cleaned.xlsx"
    mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

st.download_button(
    label="⬇️ تحميل الملف المنظّف | Download cleaned file",
    data=out_bytes,
    file_name=out_name,
    mime=mime,
    use_container_width=True,
)

st.markdown(
    """
    <div class="success-box" style="margin-top:16px;">
        <strong>✅ ملفك جاهز للتحميل! | Your file is ready to download!</strong><br>
        <span style="font-size:0.85rem; color:#555;">
        إذا كان الملف يحتوي على نص عربي، استخدم صيغة Excel للحفاظ على الترميز الصحيح.<br>
        <span class="ltr-text">If your file has Arabic text, use Excel format to preserve encoding.</span>
        </span>
    </div>
    """,
    unsafe_allow_html=True,
)

# ─── تذييل | Footer ────────────────────────────────────────────────────────────
st.markdown(
    """
    <hr style="margin-top:40px; border-color:#eee;" />
    <div style="text-align:center; color:#aaa; font-size:0.8rem; direction:ltr;">
        Built with ❤️ using Streamlit · 
        <a href="https://selghribi-blip.github.io" target="_blank" rel="noopener" style="color:#1a3a5c;">
            selghribi-blip.github.io
        </a>
    </div>
    """,
    unsafe_allow_html=True,
)
