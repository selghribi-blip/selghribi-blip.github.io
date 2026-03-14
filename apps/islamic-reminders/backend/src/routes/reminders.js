'use strict';

const express = require('express');
const { protect } = require('../middleware/auth');
const { toHijri } = require('../utils/hijri');
const Hadith = require('../models/Hadith');
const ReminderLog = require('../models/ReminderLog');

const router = express.Router();

/**
 * GET /api/reminders/today
 *
 * Returns up to 3 hadith matching today's Hijri month/day.
 * Falls back to the Hijri month if no day-specific results exist.
 * Optionally filters by the user's preferred categories.
 * Logs shown reminders to avoid repetition.
 */
router.get('/today', protect, async (req, res, next) => {
  try {
    const hijri = toHijri(new Date());
    const user = req.user;

    const categoryFilter =
      user.preferences.categories && user.preferences.categories.length > 0
        ? { categories: { $in: user.preferences.categories.map((c) => c._id || c) } }
        : {};

    // Fetch hadith for today's exact Hijri day
    let hadith = await Hadith.find({
      hijriMonth: hijri.month,
      hijriDay: hijri.day,
      ...categoryFilter,
    })
      .populate('categories', 'slug name')
      .limit(3)
      .lean();

    // Fall back: whole Hijri month if no day-specific results
    if (hadith.length === 0) {
      hadith = await Hadith.find({
        hijriMonth: hijri.month,
        ...categoryFilter,
      })
        .populate('categories', 'slug name')
        .limit(3)
        .lean();
    }

    // Final fallback: any hadith from DB
    if (hadith.length === 0) {
      hadith = await Hadith.find(categoryFilter)
        .populate('categories', 'slug name')
        .limit(3)
        .lean();
    }

    // Log shown reminders (best-effort, ignore duplicate errors)
    const logOps = hadith.map((h) =>
      ReminderLog.updateOne(
        {
          user: user._id,
          hadith: h._id,
          hijriYear: hijri.year,
          hijriMonth: hijri.month,
          hijriDay: hijri.day,
        },
        { $setOnInsert: { shownAt: new Date() } },
        { upsert: true }
      ).catch(() => null)
    );
    await Promise.all(logOps);

    res.json({
      hijriDate: hijri,
      reminders: hadith,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
