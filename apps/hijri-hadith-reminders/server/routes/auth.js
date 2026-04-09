const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('الاسم يجب أن يكون بين 2 و50 حرفاً'),
    body('email').isEmail().normalizeEmail().withMessage('صيغة البريد الإلكتروني غير صحيحة'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: 'بيانات غير صحيحة',
        details: errors.array().map((e) => e.msg)
      });
    }

    const { name, email, password } = req.body;

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'هذا البريد الإلكتروني مسجّل مسبقاً' });
      }

      const user = await User.create({ name, email, password });
      const token = signToken(user._id);

      res.status(201).json({
        message: 'تم إنشاء الحساب بنجاح',
        token,
        user: { id: user._id, name: user.name, email: user.email, preferences: user.preferences }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('صيغة البريد الإلكتروني غير صحيحة'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: 'بيانات غير صحيحة',
        details: errors.array().map((e) => e.msg)
      });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }

      const token = signToken(user._id);

      res.json({
        message: 'تم تسجيل الدخول بنجاح',
        token,
        user: { id: user._id, name: user.name, email: user.email, preferences: user.preferences }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      preferences: req.user.preferences
    }
  });
});

module.exports = router;
