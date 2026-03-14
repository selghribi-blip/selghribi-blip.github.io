# 🕌 ذكريات النبي ﷺ

> تطبيق ويب يُذكِّرك بالأحاديث النبوية الشريفة حسب التاريخ الهجري، مع إمكانية البحث حسب الموضوع والتصنيف.

---

## 📋 نظرة عامة

يهدف هذا التطبيق إلى مساعدة المسلم على استحضار هدي النبي ﷺ في حياته اليومية، عبر:

- **تذكيرات يومية** مرتبطة بالتاريخ الهجري (اليوم والشهر)
- **بحث ذكي** في نصوص الأحاديث حسب الكلمة المفتاحية أو التصنيف
- **تفضيلات شخصية** لاختيار الموضوعات التي تهمّك (العبادة، الأخلاق، الأسرة…)
- **واجهة عربية كاملة** مع دعم RTL وعرض التاريخ الهجري بالأرقام العربية

---

## 🛠 التقنيات المستخدمة

| الطبقة        | التقنية                              |
|--------------|--------------------------------------|
| الواجهة الأمامية | React 18 + React Router v6          |
| الواجهة الخلفية | Node.js + Express 4                 |
| قاعدة البيانات | MongoDB + Mongoose                  |
| المصادقة      | JWT (jsonwebtoken + bcryptjs)        |
| التاريخ الهجري | moment-hijri                        |
| الأمان        | helmet + express-rate-limit          |
| النشر         | Heroku (Procfile جاهز)              |

---

## 🚀 التشغيل محلياً

### المتطلبات
- Node.js ≥ 18
- MongoDB (محلي أو Atlas)

### الخطوات

```bash
# 1. الدخول إلى مجلد المشروع
cd apps/hijri-hadith-reminders

# 2. نسخ متغيرات البيئة
cp .env.example .env
# عدّل قيم MONGODB_URI و JWT_SECRET في ملف .env

# 3. تثبيت تبعيات الخادم
npm install

# 4. تثبيت تبعيات الواجهة وبناؤها
npm run build

# 5. تهيئة قاعدة البيانات بالبيانات النموذجية
npm run seed

# 6. تشغيل الخادم
npm start
# أو في وضع التطوير:
npm run dev:server
```

افتح المتصفح على: [http://localhost:5000](http://localhost:5000)

---

## 📁 هيكل المشروع

```
apps/hijri-hadith-reminders/
├── Procfile                    # إعداد Heroku
├── package.json                # حزم الجذر + سكريبتات البناء
├── .env.example                # نموذج متغيرات البيئة
├── server/
│   ├── index.js                # نقطة دخول الخادم (Express)
│   ├── seed.js                 # تهيئة البيانات النموذجية
│   ├── models/
│   │   ├── User.js             # نموذج المستخدم
│   │   └── Hadith.js           # نموذج الحديث
│   ├── routes/
│   │   ├── auth.js             # تسجيل / دخول / جلسة
│   │   ├── reminders.js        # تذكيرات اليوم
│   │   ├── hadith.js           # بحث الأحاديث
│   │   └── preferences.js      # تفضيلات المستخدم
│   ├── middleware/
│   │   └── auth.js             # حماية المسارات بـ JWT
│   └── data/
│       └── hadiths-seed.json   # بيانات نموذجية أولية
└── client/
    ├── public/
    │   ├── index.html          # lang="ar" dir="rtl"
    │   └── manifest.json
    └── src/
        ├── App.js              # التوجيه الرئيسي
        ├── index.css           # تنسيقات RTL + متغيرات CSS
        ├── context/
        │   └── AuthContext.js  # حالة المصادقة
        ├── utils/
        │   ├── api.js          # axios مع JWT interceptors
        │   └── helpers.js      # أرقام عربية + تنسيق التاريخ
        ├── components/
        │   ├── Navbar.js       # شريط التنقل
        │   ├── HadithCard.js   # بطاقة عرض الحديث
        │   └── ProtectedRoute.js
        └── pages/
            ├── Login.js        # صفحة الدخول
            ├── Register.js     # صفحة التسجيل
            ├── Dashboard.js    # لوحة التذكيرات اليومية
            ├── Search.js       # البحث والتصفية
            └── Preferences.js  # التفضيلات الشخصية
```

---

## 🔌 واجهات برمجة التطبيقات (API)

| الطريقة | المسار                  | الحماية | الوصف                          |
|--------|------------------------|---------|-------------------------------|
| POST   | `/api/auth/register`   | ✗       | إنشاء حساب جديد               |
| POST   | `/api/auth/login`      | ✗       | تسجيل الدخول والحصول على JWT  |
| GET    | `/api/auth/me`         | ✓ JWT   | بيانات المستخدم الحالي        |
| GET    | `/api/reminders/today` | ✓ JWT   | تذكيرات اليوم الهجري          |
| GET    | `/api/reminders/categories` | ✓ JWT | قائمة التصنيفات          |
| GET    | `/api/hadith/search`   | ✓ JWT   | بحث بكلمة/تصنيف + ترقيم       |
| GET    | `/api/hadith/:id`      | ✓ JWT   | تفاصيل حديث محدد              |
| PUT    | `/api/preferences`     | ✓ JWT   | حفظ تفضيلات المستخدم          |

---

## ⚠️ ملاحظة حول البيانات

البيانات الحالية في `server/data/hadiths-seed.json` هي **نماذج للعرض فقط**. لإطلاق نسخة عامة موثوقة، يجب:

1. الحصول على **مجموعة أحاديث موثّقة ومرخّصة** من مصادر معتمدة.
2. تحويلها إلى صيغة JSON المتوافقة مع نموذج `Hadith.js`.
3. تشغيل `npm run seed` لاستيرادها.

---

## 💡 خطة الربح خلال 30 يومًا

| المرحلة | الإجراء | الهدف |
|--------|--------|-------|
| الأسبوع 1 | إطلاق نسخة مجانية محدودة (5 تذكيرات/يوم) | جمع المستخدمين الأوائل |
| الأسبوع 2 | إضافة خطة **Pro** (تذكيرات غير محدودة + تخصيص كامل) | أول دخل |
| الأسبوع 3 | بوت Telegram للتذكيرات اليومية تلقائياً | توسيع القناة |
| الأسبوع 4 | **B2B Widget** للمواقع الإسلامية (API مؤجّر) | دخل متكرر |

---

## 🌐 النشر على Heroku

```bash
# Deploy commands (English section for CI/CD reference)
heroku create your-app-name
heroku config:set MONGODB_URI=<your-atlas-uri>
heroku config:set JWT_SECRET=<your-secret>
heroku config:set NODE_ENV=production
git subtree push --prefix apps/hijri-hadith-reminders heroku main
```

---

## 📜 الرخصة

MIT — استخدم الكود بحرية مع الحفاظ على حقوق المؤلف.
