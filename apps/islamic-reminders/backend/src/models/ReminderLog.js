'use strict';

const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hadith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hadith',
      required: true,
    },
    hijriYear: { type: Number, required: true },
    hijriMonth: { type: Number, required: true },
    hijriDay: { type: Number, required: true },
    shownAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Prevent showing the same hadith twice on the same Hijri day
reminderLogSchema.index(
  { user: 1, hadith: 1, hijriYear: 1, hijriMonth: 1, hijriDay: 1 },
  { unique: true }
);

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
