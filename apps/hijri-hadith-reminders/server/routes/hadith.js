const express = require('express');
const { query, validationResult } = require('express-validator');
const Hadith = require('../models/Hadith');
const { protect } = require('../middleware/auth');

const router = express.Router();

const VALID_CATEGORIES = [
  'العبادة', 'الأخلاق', 'الأسرة', 'المعاملات',
  'الصحة', 'العلم', 'الصبر', 'الدعاء', 'الرزق', 'اليوم الآخر'
];

// GET /api/hadith/search?q=&category=&page=
router.get(
  '/search',
  protect,
  [
    query('q').optional().isString().trim().isLength({ max: 200 }).withMessage('نص البحث يجب ألا يتجاوز 200 حرف'),
    query('category').optional().isIn(VALID_CATEGORIES).withMessage('التصنيف غير صحيح'),
    query('page').optional().isInt({ min: 1 }).withMessage('رقم الصفحة غير صحيح')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: 'بيانات البحث غير صحيحة',
        details: errors.array().map((e) => e.msg)
      });
    }

    const { q, category, page = 1 } = req.query;
    const limit = 10;
    const skip = (parseInt(page) - 1) * limit;

    try {
      const filter = {};

      if (q && q.trim()) {
        filter.$text = { $search: q.trim() };
      }

      if (category) {
        filter.category = category;
      }

      const [hadiths, total] = await Promise.all([
        Hadith.find(filter).skip(skip).limit(limit),
        Hadith.countDocuments(filter)
      ]);

      res.json({
        results: hadiths,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'حدث خطأ أثناء البحث' });
    }
  }
);

// GET /api/hadith/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const hadith = await Hadith.findById(req.params.id);
    if (!hadith) {
      return res.status(404).json({ error: 'الحديث غير موجود' });
    }
    res.json({ hadith });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ في جلب الحديث' });
  }
});

module.exports = router;
