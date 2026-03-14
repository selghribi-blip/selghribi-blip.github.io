require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const remindersRoutes = require('./routes/reminders');
const hadithRoutes = require('./routes/hadith');
const preferencesRoutes = require('./routes/preferences');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً' }
});
app.use('/api/', limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'محاولات تسجيل دخول كثيرة، يرجى الانتظار 15 دقيقة' }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/hadith', hadithRoutes);
app.use('/api/preferences', preferencesRoutes);

// Serve React client in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'الخادم يعمل بشكل صحيح' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hijri-hadith')
  .then(() => {
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`الخادم يعمل على المنفذ ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('خطأ في الاتصال بقاعدة البيانات:', err.message);
    process.exit(1);
  });

module.exports = app;
