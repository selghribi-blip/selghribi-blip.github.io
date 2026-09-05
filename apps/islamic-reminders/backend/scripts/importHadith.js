'use strict';

/**
 * Import hadith from a licensed JSON dataset.
 *
 * Usage:
 *   node scripts/importHadith.js --file=/path/to/dataset.json
 *
 * Expected JSON format (array of objects):
 * [
 *   {
 *     "source": "Sahih al-Bukhari 6412",
 *     "collection": "bukhari",
 *     "hadithNumber": "6412",
 *     "hijriMonth": 9,
 *     "hijriDay": 1,
 *     "text": "...",
 *     "textAr": "...",
 *     "narrator": "...",
 *     "grade": "Sahih",
 *     "categories": ["ramadan","patience"],
 *     "tags": ["fasting","ramadan"]
 *   },
 *   ...
 * ]
 *
 * The `categories` field accepts category slugs which are resolved to ObjectIds.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Hadith = require('../src/models/Hadith');

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith('--file='));
if (!fileArg) {
  console.error('Usage: node scripts/importHadith.js --file=/path/to/dataset.json');
  process.exit(1);
}

const filePath = path.resolve(fileArg.replace('--file=', ''));

async function run() {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const dataset = JSON.parse(raw);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Build slug → _id map
  const cats = await Category.find().lean();
  const catMap = Object.fromEntries(cats.map((c) => [c.slug, c._id]));

  let inserted = 0;
  let skipped = 0;

  for (const item of dataset) {
    const { categories: slugs, ...data } = item;
    const categoryIds = (slugs || []).map((s) => catMap[s]).filter(Boolean);
    const result = await Hadith.findOneAndUpdate(
      { source: data.source },
      { $set: { ...data, categories: categoryIds } },
      { upsert: true, new: true, rawResult: true }
    );
    if (result.lastErrorObject.upserted) {
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log(`Import complete. Inserted: ${inserted}, Updated: ${skipped}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
