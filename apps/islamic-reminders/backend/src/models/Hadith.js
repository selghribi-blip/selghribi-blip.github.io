'use strict';

const mongoose = require('mongoose');

/**
 * Hadith model.
 *
 * NOTE ON COPYRIGHT:
 * This application does NOT store copyrighted hadith text in the codebase.
 * The `text` and `textAr` fields hold placeholder content.
 * To populate production data, obtain a license from a reputable source
 * (e.g. Sunnah.com API, authenticated hadith datasets) and run the
 * import script in scripts/importHadith.js with your licensed dataset.
 * See README.md for details.
 */
const hadithSchema = new mongoose.Schema(
  {
    // Source reference (e.g. "Sahih al-Bukhari 6412")
    source: { type: String, required: true, trim: true },
    // Collection slug (bukhari, muslim, tirmidhi, etc.)
    collection: { type: String, lowercase: true, trim: true },
    // Book / chapter number within the collection
    bookNumber: Number,
    hadithNumber: String,

    // Hijri date context (month + day, if this hadith is associated with a date)
    hijriMonth: { type: Number, min: 1, max: 12 },
    hijriDay: { type: Number, min: 1, max: 30 },

    // Placeholder text – replace with licensed content
    text: {
      type: String,
      required: true,
      trim: true,
    },
    textAr: { type: String, trim: true }, // Arabic text (placeholder)

    narrator: { type: String, trim: true }, // e.g. "Abu Hurairah (RA)"
    grade: { type: String, trim: true }, // e.g. "Sahih"

    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],

    // Tags for full-text keyword search
    tags: [{ type: String, lowercase: true, trim: true }],
  },
  { timestamps: true }
);

// Text index for search
hadithSchema.index({ text: 'text', tags: 'text', narrator: 'text' });

module.exports = mongoose.model('Hadith', hadithSchema);
