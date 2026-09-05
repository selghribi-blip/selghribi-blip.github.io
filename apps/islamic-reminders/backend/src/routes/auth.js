'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Strict rate limit for auth endpoints (20 req / 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// ─── POST /api/auth/register ────────────────────────────────────────────────
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('name').optional().trim().isLength({ max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const user = await User.create({ email, password, name });
      const token = signToken(user._id);

      res.status(201).json({
        token,
        user: { id: user._id, email: user.email, name: user.name },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/auth/login ───────────────────────────────────────────────────
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = signToken(user._id);

      res.json({
        token,
        user: { id: user._id, email: user.email, name: user.name },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
