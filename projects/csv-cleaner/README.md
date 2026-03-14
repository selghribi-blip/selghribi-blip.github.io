# 🧹 CSV / Excel Data Cleaner

**أداة تنظيف ملفات البيانات | Data Cleaning Tool**

أداة بسيطة مبنية بـ Python + Streamlit تنظّف ملفات CSV وExcel بضغطة زر واحدة.

> ⚠️ **تحذير الخصوصية / Privacy Warning**
> لا ترفع ملفات تحتوي على بيانات حساسة مثل:
> كلمات مرور، بطاقات ائتمان، أرقام هوية وطنية، بيانات طبية.
> الأداة تعمل محليًا على جهازك — لا يُرسَل أي شيء للإنترنت.
>
> *Do NOT upload sensitive data (passwords, credit cards, personal IDs, medical records).
> This tool runs locally on your machine — nothing is sent to the internet.*

---

## ✨ الميزات | Features

| الميزة | Feature |
|---|---|
| رفع ملف CSV أو XLSX | Upload CSV or XLSX |
| إزالة الصفوف الفارغة | Remove empty rows |
| تقليم المسافات (Trim) | Trim leading/trailing spaces |
| إزالة التكرارات | Remove duplicate rows |
| محاولة إصلاح التواريخ | Auto-fix date columns |
| محاولة إصلاح الأرقام | Auto-fix number columns |
| معاينة قبل/بعد (أول 20 صف) | Before/After preview (first 20 rows) |
| تنزيل الملف المنظَّف CSV | Download cleaned CSV |
| تقرير نصي مفصَّل | Detailed text report |

---

## 🚀 التشغيل على Windows | Run on Windows

### المتطلبات | Requirements
- Python 3.9 أو أحدث — [python.org](https://www.python.org/downloads/)
- Windows 10/11

### الخطوات | Steps

```bat
REM 1. انسخ المستودع | Clone the repo
git clone https://github.com/selghribi-blip/selghribi-blip.github.io.git
cd selghribi-blip.github.io\projects\csv-cleaner

REM 2. أنشئ بيئة افتراضية (اختياري لكن موصى به) | Optional but recommended
python -m venv venv
venv\Scripts\activate

REM 3. ثبّت المكتبات | Install dependencies
pip install -r requirements.txt

REM 4. شغّل التطبيق | Run the app
streamlit run app.py
```

سيفتح المتصفح تلقائيًا على `http://localhost:8501`  
*The browser will open automatically at `http://localhost:8501`*

---

## 📦 البنية | Structure

```
projects/csv-cleaner/
├── app.py            ← تطبيق Streamlit الرئيسي
├── requirements.txt  ← المكتبات المطلوبة
└── README.md         ← هذا الملف
```

---

## 📄 الترخيص | License

MIT License — للاستخدام الشخصي والتجاري بحرية.  
*MIT License — free for personal and commercial use.*

```
MIT License
Copyright (c) 2025 selghribi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
