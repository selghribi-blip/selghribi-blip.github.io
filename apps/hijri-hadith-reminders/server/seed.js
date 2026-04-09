/**
 * سكريبت تهيئة البيانات — يُضيف الأحاديث النموذجية إلى قاعدة البيانات
 * الاستخدام: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Hadith = require('./models/Hadith');
const hadiths = require('./data/hadiths-seed.json');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hijri-hadith');
    console.log('تم الاتصال بقاعدة البيانات');

    await Hadith.deleteMany({ isPlaceholder: true });
    console.log('تم حذف البيانات النموذجية القديمة');

    await Hadith.insertMany(hadiths);
    console.log(`تم إضافة ${hadiths.length} حديث بنجاح`);

    await mongoose.disconnect();
    console.log('تم قطع الاتصال. اكتملت عملية التهيئة.');
    process.exit(0);
  } catch (err) {
    console.error('خطأ أثناء التهيئة:', err.message);
    process.exit(1);
  }
}

seed();
