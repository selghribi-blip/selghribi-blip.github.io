'use strict';

const express = require('express');
const { query } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Hadith = require('../models/Hadith');
const Category = require('../models/Category');

const router = express.Router();

/**
 * GET /api/hadith/search?q=...&category=...
 *
 * Full-text search on hadith text/tags OR keyword-based category matching.
 * Both q and category are optional; if neither is provided returns recent hadith.
 */
router.get(
  '/search',
  protect,
  [
    query('q').optional().trim().isLength({ max: 200 }),
    query('category').optional().trim().isSlug().withMessage('Invalid category slug'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const q = req.query.q || '';
      const categorySlug = req.query.category || '';
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      const filter = {};

      if (categorySlug) {
        const cat = await Category.findOne({ slug: categorySlug });
        if (cat) filter.categories = cat._id;
      }

      if (q) {
        filter.$text = { $search: q };
      }

      const [total, results] = await Promise.all([
        Hadith.countDocuments(filter),
        Hadith.find(filter, q ? { score: { $meta: 'textScore' } } : {})
          .populate('categories', 'slug name')
          .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      res.json({
        total,
        page,
        pages: Math.ceil(total / limit),
        results,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
