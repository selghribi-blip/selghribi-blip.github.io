'use strict';

/**
 * Seed data for the Islamic Reminders application.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  COPYRIGHT NOTICE
 * ─────────────────────────────────────────────────────────────────────────────
 * The hadith texts below are PLACEHOLDER summaries / paraphrases provided
 * solely to demonstrate the data structure and allow the application to run
 * in development mode.  They are NOT direct textual reproductions of any
 * copyrighted translation.
 *
 * For a production deployment you MUST replace these placeholders with text
 * from a properly licensed source.  Recommended options:
 *   • Sunnah.com API  – https://sunnah.com/developers  (free for non-commercial)
 *   • HadithAPI.com   – https://hadithapi.com          (requires API key)
 *   • Licensed print editions from recognised publishers
 *
 * See scripts/importHadith.js for an import helper that reads a JSON dataset
 * and upserts records into MongoDB.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const categories = [
  {
    slug: 'patience',
    name: 'Patience (Sabr)',
    nameAr: 'الصبر',
    description: 'Hadith on bearing hardship with patience and trust in Allah.',
    keywords: ['patience', 'sabr', 'hardship', 'trial', 'difficult', 'test', 'bear'],
  },
  {
    slug: 'gratitude',
    name: 'Gratitude (Shukr)',
    nameAr: 'الشكر',
    description: 'Hadith on thankfulness and counting blessings.',
    keywords: ['gratitude', 'thankful', 'shukr', 'blessing', 'alhamdulillah', 'grateful'],
  },
  {
    slug: 'anxiety',
    name: 'Anxiety & Stress',
    nameAr: 'القلق',
    description: 'Hadith that provide comfort during times of worry and anxiety.',
    keywords: ['anxiety', 'stress', 'worry', 'fear', 'distress', 'overwhelmed', 'panic'],
  },
  {
    slug: 'debt',
    name: 'Debt & Wealth',
    nameAr: 'الدين والمال',
    description: 'Hadith on managing wealth, avoiding debt, and seeking rizq.',
    keywords: ['debt', 'loan', 'money', 'wealth', 'financial', 'rizq', 'poverty', 'borrow'],
  },
  {
    slug: 'family',
    name: 'Family & Relationships',
    nameAr: 'الأسرة',
    description: 'Hadith on family ties, kindness to parents, and marriage.',
    keywords: ['family', 'mother', 'father', 'parent', 'marriage', 'spouse', 'children', 'kin'],
  },
  {
    slug: 'dua',
    name: 'Supplication (Du\'a)',
    nameAr: 'الدعاء',
    description: 'Hadith and supplications for every situation.',
    keywords: ['dua', 'supplication', 'pray', 'prayer', 'asking', 'invoke'],
  },
  {
    slug: 'character',
    name: 'Good Character (Akhlaq)',
    nameAr: 'الأخلاق',
    description: 'Hadith on honesty, kindness, humility and noble manners.',
    keywords: ['character', 'akhlaq', 'manners', 'honest', 'kind', 'humble', 'generous'],
  },
  {
    slug: 'ramadan',
    name: 'Ramadan',
    nameAr: 'رمضان',
    description: 'Hadith specific to the month of Ramadan.',
    keywords: ['ramadan', 'fasting', 'iftar', 'suhoor', 'laylatul qadr'],
  },
];

/**
 * Placeholder hadith records.
 * hijriMonth / hijriDay link a hadith to a specific point in the Hijri year.
 * Leave both null/undefined for "general" hadith surfaced as fallback.
 */
const hadithPlaceholders = [
  // ── Muharram (month 1) ──────────────────────────────────────────────────
  {
    source: 'Sahih Muslim – Book of Fasting (placeholder)',
    collection: 'muslim',
    hadithNumber: '1163a',
    hijriMonth: 1,
    hijriDay: 10,
    text:
      '[PLACEHOLDER] The Prophet ﷺ was asked about fasting on the Day of Ashura (10 Muharram). ' +
      'He said it expiates the sins of the previous year. ' +
      '— Replace this text with a licensed translation before production use.',
    textAr: '[نص عربي – يُستبدل بنص مرخّص]',
    narrator: 'Abu Qatada (RA)',
    grade: 'Sahih',
    categorySlugs: ['patience', 'gratitude'],
    tags: ['muharram', 'ashura', 'fasting', 'expiation'],
  },
  // ── Ramadan (month 9) ────────────────────────────────────────────────────
  {
    source: 'Sahih al-Bukhari – Book of Fasting (placeholder)',
    collection: 'bukhari',
    hadithNumber: '1901',
    hijriMonth: 9,
    hijriDay: 1,
    text:
      '[PLACEHOLDER] When Ramadan began, the Prophet ﷺ would say: ' +
      '"The gates of Paradise are opened, the gates of Hell are closed, ' +
      'and the devils are chained." ' +
      '— Replace this text with a licensed translation before production use.',
    textAr: '[نص عربي – يُستبدل بنص مرخّص]',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Sahih',
    categorySlugs: ['ramadan'],
    tags: ['ramadan', 'fasting', 'paradise'],
  },
  // ── Dhul Hijjah (month 12) ───────────────────────────────────────────────
  {
    source: 'Sahih al-Bukhari – Book of Hajj (placeholder)',
    collection: 'bukhari',
    hadithNumber: '969',
    hijriMonth: 12,
    hijriDay: 9,
    text:
      '[PLACEHOLDER] The Prophet ﷺ said about fasting on the Day of Arafah (9 Dhul Hijjah): ' +
      '"It expiates the sins of the previous year and the coming year." ' +
      '— Replace this text with a licensed translation before production use.',
    textAr: '[نص عربي – يُستبدل بنص مرخّص]',
    narrator: 'Abu Qatada (RA)',
    grade: 'Sahih',
    categorySlugs: ['patience', 'gratitude'],
    tags: ['dhul hijjah', 'arafah', 'fasting', 'hajj'],
  },
  // ── General – Patience ────────────────────────────────────────────────────
  {
    source: 'Sahih al-Bukhari – Book of Patience (placeholder)',
    collection: 'bukhari',
    hadithNumber: '5641',
    text:
      '[PLACEHOLDER] The Prophet ﷺ said: "No fatigue, illness, anxiety, grief, hurt or sadness ' +
      'afflicts a Muslim – even a prick of a thorn – except that Allah expiates some of his sins." ' +
      '— Replace this text with a licensed translation before production use.',
    textAr: '[نص عربي – يُستبدل بنص مرخّص]',
    narrator: 'Abu Sa\'id al-Khudri and Abu Hurairah (RA)',
    grade: 'Sahih',
    categorySlugs: ['patience', 'anxiety'],
    tags: ['patience', 'trial', 'expiation', 'illness'],
  },
  // ── General – Gratitude ───────────────────────────────────────────────────
  {
    source: 'Sunan al-Tirmidhi (placeholder)',
    collection: 'tirmidhi',
    hadithNumber: '2989',
    text:
      '[PLACEHOLDER] The Prophet ﷺ said: "Whoever is not thankful to people is not thankful to Allah." ' +
      '— Replace this text with a licensed translation before production use.',
    textAr: '[نص عربي – يُستبدل بنص مرخّص]',
    narrator: 'Abu Hurairah (RA)',
    grade: 'Hasan Sahih',
    categorySlugs: ['gratitude', 'character'],
    tags: ['gratitude', 'thankfulness', 'people'],
  },
  // ── General – Anxiety / Du'a ──────────────────────────────────────────────
  {
    source: 'Sunan Abu Dawud – Book of Prayer (placeholder)',
    collection: 'abu-dawud',
    hadithNumber: '1555',
    text:
      '[PLACEHOLDER] The Prophet ﷺ said: "O Allah, I seek refuge in You from anxiety and grief, ' +
      'from incapacity and laziness, from miserliness and cowardice, from the burden of debt ' +
      'and the oppression of people." ' +
      '— Replace this text with a licensed translation before production use.',
    textAr: '[نص عربي – يُستبدل بنص مرخّص]',
    narrator: 'Anas ibn Malik (RA)',
    grade: 'Sahih',
    categorySlugs: ['anxiety', 'dua', 'debt'],
    tags: ['anxiety', 'dua', 'debt', 'refuge', 'supplication'],
  },
  // ── General – Family ──────────────────────────────────────────────────────
  {
    source: 'Sahih al-Bukhari – Book of Good Manners (placeholder)',
    collection: 'bukhari',
    hadithNumber: '5971',
    text:
      '[PLACEHOLDER] The Prophet ﷺ said: "Paradise lies at the feet of your mother." ' +
      '— Replace this text with a licensed translation before production use.',
    textAr: '[نص عربي – يُستبدل بنص مرخّص]',
    narrator: 'Mu\'awiyah ibn Jahima al-Sulami (RA)',
    grade: 'Hasan',
    categorySlugs: ['family'],
    tags: ['mother', 'parents', 'paradise', 'family'],
  },
  // ── General – Character ───────────────────────────────────────────────────
  {
    source: 'Sunan al-Tirmidhi (placeholder)',
    collection: 'tirmidhi',
    hadithNumber: '2004',
    text:
      '[PLACEHOLDER] The Prophet ﷺ said: "The best among you are those with the best character." ' +
      '— Replace this text with a licensed translation before production use.',
    textAr: '[نص عربي – يُستبدل بنص مرخّص]',
    narrator: 'Abdullah ibn Amr (RA)',
    grade: 'Sahih',
    categorySlugs: ['character'],
    tags: ['character', 'akhlaq', 'manners', 'best'],
  },
];

module.exports = { categories, hadithPlaceholders };
