'use strict';

const express = require('express');
const { protect } = require('../middleware/auth');
const Category = require('../models/Category');

const router = express.Router();

// ─── GET /api/categories ─────────────────────────────────────────────────────
router.get('/', protect, async (_req, res, next) => {
  try {
    const categories = await Category.find().sort('name').lean();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
