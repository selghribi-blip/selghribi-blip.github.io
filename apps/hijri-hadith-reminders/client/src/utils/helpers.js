/**
 * تحويل الأرقام إلى أرقام عربية
 * @param {number|string} num
 */
export function toArabicNumerals(num) {
  return String(num).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
}

/**
 * تنسيق التاريخ الميلادي بالعربية
 * @param {string} isoDate  — e.g. "2025-01-15"
 */
export function formatGregorianArabic(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * عرض رسالة خطأ من استجابة axios
 */
export function extractError(err) {
  return (
    err?.response?.data?.error ||
    (err?.response?.data?.details && err.response.data.details.join('، ')) ||
    'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً'
  );
}
