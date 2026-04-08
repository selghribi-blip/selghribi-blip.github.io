'use strict';

/**
 * Seed script – inserts initial categories and placeholder hadith.
 *
 * Usage:
 *   cd apps/islamic-reminders/backend
 *   cp .env.example .env        # fill in MONGODB_URI
 *   node scripts/seed.js
 *
 * Safe to run multiple times – uses upsert to avoid duplicates.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Hadith = require('../src/models/Hadith');
const { categories, hadithPlaceholders } = require('../data/seed-data');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // ── Upsert categories ────────────────────────────────────────────────────
  const catMap = {}; // slug → _id
  for (const cat of categories) {
    const result = await Category.findOneAndUpdate(
      { slug: cat.slug },
      {
        $set: {
          name: cat.name,
          nameAr: cat.nameAr,
          description: cat.description,
          keywords: cat.keywords,
        },
      },
      { upsert: true, new: true }
    );
    catMap[cat.slug] = result._id;
    console.log(`  ✔ Category: ${cat.slug}`);
  }

  // ── Upsert hadith placeholders ───────────────────────────────────────────
  for (const h of hadithPlaceholders) {
    const { categorySlugs, ...hadithData } = h;
    const categoryIds = (categorySlugs || []).map((s) => catMap[s]).filter(Boolean);

    await Hadith.findOneAndUpdate(
      { source: hadithData.source },
      {
        $set: {
          ...hadithData,
          categories: categoryIds,
        },
      },
      { upsert: true, new: true }
    );
    console.log(`  ✔ Hadith: ${hadithData.source}`);
  }

  console.log('\nSeed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
