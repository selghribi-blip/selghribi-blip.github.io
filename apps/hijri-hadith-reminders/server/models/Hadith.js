const mongoose = require('mongoose');

const hadithSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'نص الحديث مطلوب'],
      trim: true
    },
    source: {
      type: String,
      required: [true, 'مصدر الحديث مطلوب'],
      trim: true
    },
    narrator: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'تصنيف الحديث مطلوب'],
      enum: [
        'العبادة',
        'الأخلاق',
        'الأسرة',
        'المعاملات',
        'الصحة',
        'العلم',
        'الصبر',
        'الدعاء',
        'الرزق',
        'اليوم الآخر'
      ]
    },
    hijriMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: null
    },
    hijriDay: {
      type: Number,
      min: 1,
      max: 30,
      default: null
    },
    tags: {
      type: [String],
      default: []
    },
    isPlaceholder: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Text index for Arabic search
hadithSchema.index({ text: 'text', tags: 'text' });

module.exports = mongoose.model('Hadith', hadithSchema);
