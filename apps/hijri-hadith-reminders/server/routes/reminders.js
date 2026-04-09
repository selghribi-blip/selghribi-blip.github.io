const express = require('express');
const moment = require('moment-hijri');
const Hadith = require('../models/Hadith');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/reminders/today
// Returns hadiths relevant to today's Hijri date and user preferences
router.get('/today', protect, async (req, res) => {
  try {
    const today = moment();
    const hijriMonth = today.iMonth() + 1; // iMonth() is 0-based
    const hijriDay = today.iDate();

    const userCategories = req.user.preferences?.categories || [];

    // Query: match hijri date OR user preferred categories (conditionally)
    let query;
    if (userCategories.length > 0) {
      query = { $or: [{ hijriMonth, hijriDay }, { category: { $in: userCategories } }] };
    } else {
      query = { hijriMonth, hijriDay };
    }

    const hadiths = await Hadith.find(query).limit(10);

    // Fallback: return general hadiths if none found
    const results =
      hadiths.length > 0
        ? hadiths
        : await Hadith.find({}).limit(5);

    res.json({
      hijriDate: {
        day: hijriDay,
        month: hijriMonth,
        year: today.iYear(),
        monthName: getHijriMonthName(hijriMonth),
        formatted: `${hijriDay} ${getHijriMonthName(hijriMonth)} ${today.iYear()} هـ`
      },
      gregorianDate: today.format('YYYY-MM-DD'),
      reminders: results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ في جلب التذكيرات' });
  }
});

// GET /api/reminders/categories
router.get('/categories', protect, (req, res) => {
  res.json({
    categories: [
      'العبادة',
      'الأخلاق',
      'الأسرة',
      'المعاملات',
      'الصحة',
      'العلم',
      'الصبر',
      'الدعاء',
      'الرزق',
      'اليوم الآخر'
    ]
  });
});

function getHijriMonthName(month) {
  const months = [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الثاني',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة'
  ];
  return months[month - 1] || '';
}

module.exports = router;
