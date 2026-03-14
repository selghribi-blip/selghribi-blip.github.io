const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const VALID_CATEGORIES = [
  'العبادة', 'الأخلاق', 'الأسرة', 'المعاملات',
  'الصحة', 'العلم', 'الصبر', 'الدعاء', 'الرزق', 'اليوم الآخر'
];

// PUT /api/preferences
router.put(
  '/',
  protect,
  [
    body('categories')
      .isArray()
      .notEmpty()
      .withMessage('يجب اختيار تصنيف واحد على الأقل')
      .custom((cats) => Array.isArray(cats) && cats.length > 0 && cats.every((c) => VALID_CATEGORIES.includes(c)))
      .withMessage('أحد التصنيفات المختارة غير صحيح'),
    body('notifications').optional().isBoolean().withMessage('إعداد التنبيهات غير صحيح')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: 'بيانات غير صحيحة',
        details: errors.array().map((e) => e.msg)
      });
    }

    const { categories, notifications } = req.body;

    try {
      const update = { 'preferences.categories': categories };
      if (notifications !== undefined) {
        update['preferences.notifications'] = notifications;
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: update },
        { new: true, runValidators: true }
      );

      res.json({
        message: 'تم حفظ التفضيلات بنجاح',
        preferences: user.preferences
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'حدث خطأ في حفظ التفضيلات' });
    }
  }
);

module.exports = router;
