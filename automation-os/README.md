# Automation OS

نظام أتمتة خفيف الوزن مبني على Python يعمل داخل GitHub Codespaces. يشغّل خدمتين تلقائياً عبر Supervisor:

- **Dashboard** – خادم HTTP على المنفذ `8080` يوفر `/health` و `/status`
- **WorkerOS** – مدير مهام مجدوَلة يعمل في الخلفية

---

## الهيكل

```
automation-os/
├── workers/
│   └── worker_manager.py    # WorkerOS: إدارة threads + JSONL logging
├── dashboard/
│   └── app.py               # HTTP server على 0.0.0.0:8080
├── schedulers/
│   ├── master_run.py        # نقطة الدخول: يبدأ Dashboard + WorkerOS
│   └── tiktok_weekly_report.py  # يقرأ TikTok CSV ويبعث تقرير Telegram
├── storage/
│   └── tiktok_exports/      # ضع هنا ملفات CSV المُصدَّرة من TikTok
└── logs/                    # تُنشأ تلقائياً عند التشغيل
```

---

## كيف يعمل داخل Codespace

عند فتح Codespace تنفيذ الخطوات التالية يتم تلقائياً:

1. **postCreateCommand** – يثبّت المتطلبات (`pip install schedule requests supervisor`).
2. **postStartCommand** – يشغّل `supervisord` الذي يبدأ:
   - `dashboard` على المنفذ 8080
   - `worker_os` (master_run.py) الذي يجدوِل المهام

لا تحتاج لأي شيء بعد فتح الـ Codespace.

---

## أين تضع TikTok exports

1. افتح TikTok Studio أو Creator Center وصدِّر بيانات الأداء بصيغة CSV.
2. ضع الملف داخل:
   ```
   automation-os/storage/tiktok_exports/my_export.csv
   ```
3. عند الساعة **23:50** يومياً، سيقرأ `tiktok_weekly_report` أحدث ملف CSV ويضيف صفًا إلى `logs/weekly_report.csv`.

> الكود يدعم أسماء أعمدة مختلفة (views، video_views، plays…) بشكل تلقائي.

---

## ضبط Secrets في Codespaces

لإرسال إشعارات Telegram، أضف هذه المتغيرات من:
**GitHub → Settings → Codespaces → Secrets**

| Secret | القيمة |
|---|---|
| `TG_BOT_TOKEN` | توكن بوت Telegram من @BotFather |
| `TG_CHAT_ID` | معرف القناة أو المحادثة (مثال: `@SAFHATOOON`) |

Codespaces تُدرج هذه الأسرار تلقائياً كمتغيرات بيئة عند بدء الجلسة.

---

## اختبار الـ endpoints

بعد فتح Codespace وانتظار بضع ثوانٍ حتى يبدأ الـ Dashboard:

```bash
# من داخل terminal الـ Codespace
curl http://localhost:8080/health
# → OK

curl http://localhost:8080/status
# → {"uptime_seconds": ..., "workers_count": 1, "last_10_logs": [...], ...}
```

أو افتح المنفذ 8080 من قائمة **Ports** في VS Code وزر `/health` أو `/status` في المتصفح.

---

## تشغيل يدوي (للاختبار)

```bash
# من جذر الريبو
export PYTHONPATH="$(pwd)/automation-os"

# تشغيل master_run يدوياً (يبدأ dashboard + scheduler)
python3 automation-os/schedulers/master_run.py

# أو تشغيل تقرير TikTok مباشرةً (للاختبار)
python3 automation-os/schedulers/tiktok_weekly_report.py
```

---

## السجلات

| الملف | المحتوى |
|---|---|
| `logs/worker_manager.jsonl` | كل أحداث WorkerOS (بدء/نجاح/خطأ) |
| `logs/weekly_report.csv` | نتائج TikTok المجمَّعة أسبوعياً |
| `logs/dashboard.out.log` | مخرجات Dashboard |
| `logs/worker_os.out.log` | مخرجات WorkerOS |
| `logs/supervisord.log` | سجل Supervisor |
