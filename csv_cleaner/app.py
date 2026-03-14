"""
أداة تنظيف ملفات CSV/Excel | CSV/Excel Data Cleaner Tool
مشروع: selghribi-blip | Project: selghribi-blip
"""

import io
import pandas as pd
import streamlit as st

# ────────────────────────────────────────────────────────────
# إعداد الصفحة | Page configuration
# ────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="منظف CSV/Excel | CSV/Excel Cleaner",
    page_icon="🧹",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ────────────────────────────────────────────────────────────
# CSS مخصص — RTL للعربية + LTR للإنجليزية | Custom CSS
# ────────────────────────────────────────────────────────────
st.markdown(
    """
    <style>
        /* الخطوط | Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

        html, body, [class*="css"] {
            font-family: 'Cairo', sans-serif;
        }

        /* النص العربي الرئيسي | Main Arabic text */
        .ar {
            direction: rtl;
            text-align: right;
            font-weight: 700;
            font-size: 1.05rem;
            color: #1a3a5c;
            line-height: 1.8;
        }

        /* النص الإنجليزي المساعد | Helper English text */
        .en {
            direction: ltr;
            text-align: left;
            font-size: 0.82rem;
            color: #6b7a8d;
            font-weight: 400;
            margin-top: 2px;
            font-family: 'Segoe UI', Arial, sans-serif;
        }

        /* حاوية النص الثنائي | Bilingual text container */
        .bilingual {
            margin-bottom: 6px;
        }

        /* عناوين الأقسام | Section headings */
        .section-heading {
            border-right: 4px solid #c0674a;
            padding-right: 10px;
            margin: 18px 0 10px 0;
        }

        /* بطاقة الإحصائيات | Stats card */
        .stat-box {
            background: #f0f4f8;
            border-radius: 10px;
            padding: 16px;
            text-align: center;
            border: 1px solid #dce3ed;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #c0674a;
        }
        .stat-label-ar {
            font-size: 0.9rem;
            color: #1a3a5c;
            font-weight: 600;
        }
        .stat-label-en {
            font-size: 0.75rem;
            color: #6b7a8d;
        }

        /* رسالة النجاح | Success message */
        .success-banner {
            background: #d4edda;
            border: 1px solid #28a745;
            border-radius: 8px;
            padding: 14px 18px;
            margin: 12px 0;
        }

        /* رسالة تحذير | Warning message */
        .warn-banner {
            background: #fff3cd;
            border: 1px solid #d4a843;
            border-radius: 8px;
            padding: 14px 18px;
            margin: 12px 0;
        }

        /* شريط جانبي | Sidebar */
        section[data-testid="stSidebar"] {
            background: #1a3a5c;
            color: #fdf6ec;
        }
        section[data-testid="stSidebar"] * {
            color: #fdf6ec !important;
        }
        section[data-testid="stSidebar"] .en {
            color: rgba(255,255,255,0.65) !important;
        }
    </style>
    """,
    unsafe_allow_html=True,
)


# ────────────────────────────────────────────────────────────
# دالة مساعدة: عرض نص ثنائي اللغة | Helper: bilingual text
# ────────────────────────────────────────────────────────────
def bilingual(arabic: str, english: str) -> str:
    """Return HTML with Arabic text + English subtitle."""
    return (
        f'<div class="bilingual">'
        f'<div class="ar">{arabic}</div>'
        f'<div class="en">{english}</div>'
        f'</div>'
    )


def section_heading(arabic: str, english: str) -> None:
    st.markdown(
        f'<div class="section-heading">{bilingual(arabic, english)}</div>',
        unsafe_allow_html=True,
    )


# ────────────────────────────────────────────────────────────
# الشريط الجانبي | Sidebar
# ────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown(
        bilingual("🧹 منظف البيانات", "Data Cleaner"),
        unsafe_allow_html=True,
    )
    st.markdown("---")

    st.markdown(
        bilingual("⚙️ خيارات التنظيف", "Cleaning Options"),
        unsafe_allow_html=True,
    )

    opt_empty_rows = st.checkbox(
        label="",
        value=True,
        key="opt_empty_rows",
        help="Remove rows where all cells are empty",
    )
    st.markdown(
        bilingual("حذف الصفوف الفارغة", "Remove empty rows"),
        unsafe_allow_html=True,
    )

    opt_duplicates = st.checkbox(
        label="",
        value=True,
        key="opt_duplicates",
        help="Remove duplicate rows",
    )
    st.markdown(
        bilingual("حذف التكرارات", "Remove duplicate rows"),
        unsafe_allow_html=True,
    )

    opt_trim = st.checkbox(
        label="",
        value=True,
        key="opt_trim",
        help="Trim leading/trailing spaces from text cells",
    )
    st.markdown(
        bilingual("إزالة المسافات الزائدة", "Trim extra spaces"),
        unsafe_allow_html=True,
    )

    opt_dates = st.checkbox(
        label="",
        value=False,
        key="opt_dates",
        help="Try to fix date column formats",
    )
    st.markdown(
        bilingual("محاولة إصلاح أعمدة التواريخ", "Try to fix date columns"),
        unsafe_allow_html=True,
    )

    opt_empty_cols = st.checkbox(
        label="",
        value=False,
        key="opt_empty_cols",
        help="Remove columns where all values are empty",
    )
    st.markdown(
        bilingual("حذف الأعمدة الفارغة كلياً", "Remove fully empty columns"),
        unsafe_allow_html=True,
    )

    st.markdown("---")
    st.markdown(
        bilingual(
            "📁 قالب التنظيف",
            "Cleaning preset",
        ),
        unsafe_allow_html=True,
    )
    preset = st.selectbox(
        label="",
        options=[
            "عام | General",
            "قوائم عملاء | Client lists",
            "بيانات متجر | Shop data",
            "بيانات فريلانسر | Freelancer data",
        ],
        key="preset",
        label_visibility="collapsed",
    )

    st.markdown("---")
    st.markdown(
        '<div class="en" style="font-size:0.72rem; color:rgba(255,255,255,0.5)!important;">'
        "selghribi-blip — CSV/Excel Cleaner v1.0"
        "</div>",
        unsafe_allow_html=True,
    )


# ────────────────────────────────────────────────────────────
# العنوان الرئيسي | Main title
# ────────────────────────────────────────────────────────────
st.markdown(
    """
    <div style="text-align:center; padding: 24px 0 8px 0;">
        <div style="font-size:3rem;">🧹</div>
        <div class="ar" style="font-size:1.7rem; color:#1a3a5c;">
            أداة تنظيف ملفات CSV / Excel
        </div>
        <div class="en" style="text-align:center; font-size:0.95rem; color:#6b7a8d; margin-top:4px;">
            CSV / Excel Data Cleaner Tool
        </div>
        <hr style="margin: 16px auto; border-color:#dce3ed; max-width:400px;">
    </div>
    """,
    unsafe_allow_html=True,
)


# ────────────────────────────────────────────────────────────
# رفع الملف | File upload
# ────────────────────────────────────────────────────────────
section_heading("📂 رفع الملف", "Upload your file")

uploaded = st.file_uploader(
    label="",
    type=["csv", "xlsx", "xls"],
    help="Supported: CSV, Excel (.xlsx, .xls) — Max 200 MB",
    label_visibility="collapsed",
)

st.markdown(
    bilingual(
        "الصيغ المدعومة: CSV · Excel (.xlsx / .xls)",
        "Supported formats: CSV · Excel (.xlsx / .xls)",
    ),
    unsafe_allow_html=True,
)


# ────────────────────────────────────────────────────────────
# معالجة الملف | File processing
# ────────────────────────────────────────────────────────────
def _load_file(f) -> pd.DataFrame:
    """Load CSV or Excel file into a DataFrame."""
    name = f.name.lower()
    if name.endswith(".csv"):
        try:
            return pd.read_csv(f, encoding="utf-8")
        except UnicodeDecodeError:
            f.seek(0)
            return pd.read_csv(f, encoding="latin-1")
    else:
        return pd.read_excel(f)


def _clean(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Apply selected cleaning operations. Returns (cleaned_df, report_dict)."""
    report: dict = {}
    original_rows = len(df)
    original_cols = len(df.columns)

    # 1. حذف الصفوف الفارغة | Remove empty rows
    if opt_empty_rows:
        before = len(df)
        df = df.dropna(how="all")
        report["empty_rows_removed"] = before - len(df)

    # 2. حذف التكرارات | Remove duplicates
    if opt_duplicates:
        before = len(df)
        df = df.drop_duplicates()
        report["duplicates_removed"] = before - len(df)

    # 3. إزالة المسافات الزائدة | Trim spaces
    if opt_trim:
        fixed = 0
        for col in df.select_dtypes(include=["object"]).columns:
            trimmed = df[col].astype(str).str.strip()
            changed = (trimmed != df[col].astype(str)).sum()
            fixed += int(changed)
            df[col] = df[col].apply(
                lambda x: x.strip() if isinstance(x, str) else x
            )
        report["cells_trimmed"] = fixed

    # 4. محاولة إصلاح التواريخ | Try to fix date columns
    if opt_dates:
        fixed_cols: list[str] = []
        for col in df.select_dtypes(include=["object"]).columns:
            try:
                converted = pd.to_datetime(df[col], infer_datetime_format=True, errors="coerce")
                if converted.notna().sum() > len(df) * 0.5:
                    df[col] = converted.dt.strftime("%Y-%m-%d")
                    fixed_cols.append(col)
            except Exception:
                pass
        report["date_cols_fixed"] = fixed_cols

    # 5. حذف الأعمدة الفارغة | Remove empty columns
    if opt_empty_cols:
        before_cols = len(df.columns)
        df = df.dropna(axis=1, how="all")
        report["empty_cols_removed"] = before_cols - len(df.columns)

    report["original_rows"] = original_rows
    report["original_cols"] = original_cols
    report["final_rows"] = len(df)
    report["final_cols"] = len(df.columns)
    return df, report


def _to_bytes(df: pd.DataFrame, ext: str) -> bytes:
    """Convert DataFrame to bytes for download."""
    buf = io.BytesIO()
    if ext in ("xlsx", "xls"):
        df.to_excel(buf, index=False, engine="openpyxl")
    else:
        df.to_csv(buf, index=False, encoding="utf-8-sig")
    return buf.getvalue()


# ────────────────────────────────────────────────────────────
# المعاينة والتنظيف | Preview & Clean
# ────────────────────────────────────────────────────────────
if uploaded is not None:
    # تحميل الملف | Load the file
    try:
        df_raw = _load_file(uploaded)
    except Exception as exc:
        st.error(f"❌ خطأ في قراءة الملف | Error reading file: {exc}")
        st.stop()

    # ── المعاينة الأصلية | Original preview ──
    section_heading("👁️ معاينة الملف الأصلي", "Preview: original file")

    col_info1, col_info2 = st.columns(2)
    with col_info1:
        st.markdown(
            f'<div class="stat-box">'
            f'<div class="stat-number">{len(df_raw):,}</div>'
            f'<div class="stat-label-ar">عدد الصفوف</div>'
            f'<div class="stat-label-en">Rows</div>'
            f'</div>',
            unsafe_allow_html=True,
        )
    with col_info2:
        st.markdown(
            f'<div class="stat-box">'
            f'<div class="stat-number">{len(df_raw.columns):,}</div>'
            f'<div class="stat-label-ar">عدد الأعمدة</div>'
            f'<div class="stat-label-en">Columns</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    st.dataframe(df_raw.head(20), use_container_width=True)
    st.markdown(
        bilingual("أول 20 صف فقط", "Showing first 20 rows only"),
        unsafe_allow_html=True,
    )

    st.markdown("<br>", unsafe_allow_html=True)

    # ── زر التنظيف | Clean button ──
    clean_btn = st.button(
        "🧹  تنظيف الملف  |  Clean file",
        type="primary",
        use_container_width=True,
    )

    if clean_btn:
        with st.spinner("جارٍ التنظيف… | Cleaning in progress…"):
            df_clean, report = _clean(df_raw.copy())

        # ── نتائج التنظيف | Cleaning results ──
        section_heading("✅ نتائج التنظيف", "Cleaning results")

        c1, c2, c3, c4 = st.columns(4)
        with c1:
            removed_rows = (
                report.get("empty_rows_removed", 0)
                + report.get("duplicates_removed", 0)
            )
            st.markdown(
                f'<div class="stat-box">'
                f'<div class="stat-number">{removed_rows:,}</div>'
                f'<div class="stat-label-ar">صفوف محذوفة</div>'
                f'<div class="stat-label-en">Rows removed</div>'
                f'</div>',
                unsafe_allow_html=True,
            )
        with c2:
            st.markdown(
                f'<div class="stat-box">'
                f'<div class="stat-number">{report.get("duplicates_removed", 0):,}</div>'
                f'<div class="stat-label-ar">تكرارات محذوفة</div>'
                f'<div class="stat-label-en">Duplicates removed</div>'
                f'</div>',
                unsafe_allow_html=True,
            )
        with c3:
            st.markdown(
                f'<div class="stat-box">'
                f'<div class="stat-number">{report.get("cells_trimmed", 0):,}</div>'
                f'<div class="stat-label-ar">خلايا نُظِّفت</div>'
                f'<div class="stat-label-en">Cells trimmed</div>'
                f'</div>',
                unsafe_allow_html=True,
            )
        with c4:
            st.markdown(
                f'<div class="stat-box">'
                f'<div class="stat-number">{report["final_rows"]:,}</div>'
                f'<div class="stat-label-ar">الصفوف النهائية</div>'
                f'<div class="stat-label-en">Final rows</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

        # ── تفاصيل التقرير | Report details ──
        report_lines_ar = [
            f"📄 الملف: {uploaded.name}",
            f"🔢 الصفوف الأصلية: {report['original_rows']:,}",
            f"🔢 الأعمدة الأصلية: {report['original_cols']}",
            f"🗑️ صفوف فارغة محذوفة: {report.get('empty_rows_removed', 0):,}",
            f"🔁 تكرارات محذوفة: {report.get('duplicates_removed', 0):,}",
            f"✂️ خلايا نُظِّفت (مسافات): {report.get('cells_trimmed', 0):,}",
        ]
        if opt_dates and report.get("date_cols_fixed"):
            report_lines_ar.append(
                f"📅 أعمدة تواريخ مُصلَحة: {', '.join(report['date_cols_fixed'])}"
            )
        if opt_empty_cols:
            report_lines_ar.append(
                f"🗑️ أعمدة فارغة محذوفة: {report.get('empty_cols_removed', 0)}"
            )
        report_lines_ar += [
            f"✅ الصفوف النهائية: {report['final_rows']:,}",
            f"✅ الأعمدة النهائية: {report['final_cols']}",
        ]

        report_lines_en = [
            f"File: {uploaded.name}",
            f"Original rows: {report['original_rows']:,}",
            f"Original columns: {report['original_cols']}",
            f"Empty rows removed: {report.get('empty_rows_removed', 0):,}",
            f"Duplicates removed: {report.get('duplicates_removed', 0):,}",
            f"Cells trimmed: {report.get('cells_trimmed', 0):,}",
            f"Final rows: {report['final_rows']:,}",
            f"Final columns: {report['final_cols']}",
        ]

        with st.expander(
            "📋  عرض تقرير التغييرات الكامل  |  View full change report",
            expanded=False,
        ):
            col_rep_ar, col_rep_en = st.columns(2)
            with col_rep_ar:
                st.markdown(
                    '<div class="ar">تقرير التغييرات</div>',
                    unsafe_allow_html=True,
                )
                for line in report_lines_ar:
                    st.markdown(
                        f'<div class="ar" style="font-size:0.9rem; font-weight:400;">{line}</div>',
                        unsafe_allow_html=True,
                    )
            with col_rep_en:
                st.markdown(
                    '<div class="en" style="font-size:0.85rem; font-weight:600; color:#1a3a5c;">Change report</div>',
                    unsafe_allow_html=True,
                )
                for line in report_lines_en:
                    st.markdown(
                        f'<div class="en">{line}</div>',
                        unsafe_allow_html=True,
                    )

        # ── معاينة الملف المنظّف | Cleaned file preview ──
        section_heading("👁️ معاينة الملف المنظّف", "Preview: cleaned file")
        st.dataframe(df_clean.head(20), use_container_width=True)
        st.markdown(
            bilingual("أول 20 صف", "First 20 rows of cleaned data"),
            unsafe_allow_html=True,
        )

        # ── تحميل الملف المنظّف | Download cleaned file ──
        section_heading("⬇️ تحميل الملف المنظّف", "Download cleaned file")

        ext = uploaded.name.rsplit(".", 1)[-1].lower()
        out_bytes = _to_bytes(df_clean, ext)
        out_name = uploaded.name.rsplit(".", 1)[0] + "_cleaned." + ext

        st.download_button(
            label="⬇️  تحميل الملف المنظّف  |  Download cleaned file",
            data=out_bytes,
            file_name=out_name,
            mime="text/csv" if ext == "csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
        )

        # تحميل التقرير | Download report
        report_text = "\n".join(report_lines_ar) + "\n\n--- English ---\n" + "\n".join(report_lines_en)
        st.download_button(
            label="📋  تحميل تقرير التغييرات  |  Download change report",
            data=report_text.encode("utf-8"),
            file_name=uploaded.name.rsplit(".", 1)[0] + "_report.txt",
            mime="text/plain",
            use_container_width=True,
        )

        # رسالة نجاح | Success message
        st.markdown(
            f'<div class="success-banner">'
            f'<div class="ar">✅ تم إنشاء الملف المنظّف بنجاح!</div>'
            f'<div class="en">✅ Cleaned file is ready to download.</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

else:
    # حالة البداية | Initial state — no file uploaded
    st.markdown(
        """
        <div style="text-align:center; padding:48px 16px; background:#f7f9fc; border-radius:16px; border:2px dashed #dce3ed;">
            <div style="font-size:3rem; margin-bottom:16px;">📂</div>
            <div class="ar" style="font-size:1.1rem; color:#1a3a5c;">
                ارفع ملفك للبدء
            </div>
            <div class="en" style="text-align:center; margin-top:6px;">
                Upload your CSV or Excel file to get started
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # شرح الميزات | Feature explanation
    st.markdown("<br>", unsafe_allow_html=True)
    section_heading("🛠️ ما تفعله الأداة", "What this tool does")

    cols = st.columns(3)
    features = [
        ("🗑️", "حذف الصفوف الفارغة", "Remove empty rows"),
        ("🔁", "حذف التكرارات", "Remove duplicate rows"),
        ("✂️", "إزالة المسافات الزائدة", "Trim extra spaces"),
        ("📅", "إصلاح تنسيقات التواريخ", "Fix date formats"),
        ("📊", "معاينة قبل وبعد", "Preview before & after"),
        ("⬇️", "تحميل الملف + تقرير", "Download file + report"),
    ]
    for i, (icon, ar, en) in enumerate(features):
        with cols[i % 3]:
            st.markdown(
                f'<div class="stat-box" style="margin-bottom:12px;">'
                f'<div style="font-size:1.8rem;">{icon}</div>'
                f'<div class="stat-label-ar">{ar}</div>'
                f'<div class="stat-label-en">{en}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )
