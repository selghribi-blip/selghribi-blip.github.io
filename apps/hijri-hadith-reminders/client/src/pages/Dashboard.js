import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toArabicNumerals, formatGregorianArabic, extractError } from '../utils/helpers';
import HadithCard from '../components/HadithCard';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reminders/today')
      .then((res) => setData(res.data))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="spinner">جاري تحميل تذكيرات اليوم…</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const { hijriDate, gregorianDate, reminders } = data;

  return (
    <div className="page-container">
      {/* ── بطاقة التاريخ الهجري ── */}
      <div className="hijri-card">
        <div className="hijri-date-display">
          {toArabicNumerals(hijriDate.day)} {hijriDate.monthName}{' '}
          {toArabicNumerals(hijriDate.year)} هـ
        </div>
        <div className="gregorian-date-display">
          {formatGregorianArabic(gregorianDate)}
        </div>
      </div>

      {/* ── تذكيرات اليوم ── */}
      <h2 className="page-title">تذكيرات اليوم</h2>

      {reminders && reminders.length > 0 ? (
        reminders.map((hadith) => (
          <HadithCard key={hadith._id} hadith={hadith} />
        ))
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <p>لا توجد تذكيرات لهذا اليوم</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            يمكنك تعديل تفضيلاتك أو البحث عن أحاديث بشكل يدوي
          </p>
        </div>
      )}

      {/* ── تنبيه بيانات نموذجية ── */}
      <div className="card placeholder-notice">
        <p>
          <strong>⚠️ ملاحظة:</strong> البيانات الحالية نموذجية للعرض التقديمي فقط. يرجى
          استيراد مجموعة أحاديث موثّقة ومرخّصة عبر{' '}
          <code>node seed.js</code>{' '}
          في مجلد الخادم.
        </p>
      </div>
    </div>
  );
}
