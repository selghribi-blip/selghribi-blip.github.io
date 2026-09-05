'use strict';

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    nameAr: { type: String, trim: true }, // Arabic name
    description: { type: String, trim: true },
    keywords: [{ type: String, lowercase: true, trim: true }], // for keyword matching
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
