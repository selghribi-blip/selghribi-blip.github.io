'use strict';

const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/me ─────────────────────────────────────────────────────────────
router.get('/', protect, (req, res) => {
  const { _id, email, name, preferences, createdAt } = req.user;
  res.json({ id: _id, email, name, preferences, createdAt });
});

module.exports = router;
