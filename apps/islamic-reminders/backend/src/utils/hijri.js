'use strict';

/**
 * Hijri date utilities using the built-in JavaScript Intl API.
 *
 * Uses the Islamic (Umm al-Qura / tabular) calendar via
 * Intl.DateTimeFormat with the 'islamic-umalqura' calendar extension,
 * falling back to 'islamic' if unavailable in the runtime.
 *
 * No external package required – works in Node.js ≥ 13 with full-icu data.
 */

/**
 * Convert a Gregorian Date object to Hijri.
 * @param {Date} [date] - defaults to today
 * @returns {{ year: number, month: number, day: number, monthName: string }}
 */
function toHijri(date = new Date()) {
  // Try Umm al-Qura first, fall back to generic Islamic calendar
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  } catch {
    formatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  }

  const parts = formatter.formatToParts(date);
  const get = (type) => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };

  const year = get('year');
  const month = get('month');
  const day = get('day');

  return {
    year,
    month,
    day,
    monthName: getHijriMonthName(month),
  };
}

const HIJRI_MONTH_NAMES = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

function getHijriMonthName(month) {
  return HIJRI_MONTH_NAMES[(month - 1) % 12] || 'Unknown';
}

module.exports = { toHijri, getHijriMonthName };
