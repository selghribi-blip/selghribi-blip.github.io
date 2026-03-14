'use strict';

const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const User = require('../models/User');
const Category = require('../models/Category');

const router = express.Router();

/**
 * POST /api/preferences
 *
 * Update the authenticated user's preference settings.
 * Body: { categories: [slug,...], notificationTime: "HH:mm", locale: "en"|"ar" }
 *
 * MVP: also accepts a free-text `situation` field and matches it to categories
 * via simple keyword matching.
 */
router.post(
  '/',
  protect,
  [
    body('categories')
      .optional()
      .isArray()
      .withMessage('categories must be an array of slugs'),
    body('notificationTime')
      .optional()
      .matches(/^\d{2}:\d{2}$/)
      .withMessage('notificationTime must be HH:mm'),
    body('locale')
      .optional()
      .isIn(['en', 'ar'])
      .withMessage('locale must be "en" or "ar"'),
    body('situation')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('situation max 500 chars'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { categories, notificationTime, locale, situation } = req.body;
      const user = req.user;

      // Resolve category slugs → ObjectIds
      let categoryIds = user.preferences.categories || [];
      if (Array.isArray(categories)) {
        const cats = await Category.find({ slug: { $in: categories } }).select('_id');
        categoryIds = cats.map((c) => c._id);
      }

      // Keyword-match situation text to categories (MVP)
      if (situation && situation.length > 0) {
        const situationLower = situation.toLowerCase();
        const allCats = await Category.find().lean();
        const matchedIds = allCats
          .filter((cat) =>
            cat.keywords.some((kw) => situationLower.includes(kw))
          )
          .map((cat) => cat._id);

        // Merge without duplicates
        const idSet = new Set([
          ...categoryIds.map((id) => id.toString()),
          ...matchedIds.map((id) => id.toString()),
        ]);
        categoryIds = Array.from(idSet);
      }

      user.preferences.categories = categoryIds;
      if (notificationTime !== undefined)
        user.preferences.notificationTime = notificationTime;
      if (locale !== undefined) user.preferences.locale = locale;

      await User.findByIdAndUpdate(user._id, {
        preferences: user.preferences,
      });

      const updated = await User.findById(user._id).populate(
        'preferences.categories',
        'slug name'
      );

      res.json({ preferences: updated.preferences });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
