import React from 'react';

export default function HadithCard({ hadith }) {
  if (!hadith) return null;

  return (
    <article className="hadith-card">
      <p className="hadith-text">«{hadith.text}»</p>
      <div className="hadith-meta">
        {hadith.narrator && (
          <span className="hadith-source">رواه: {hadith.narrator}</span>
        )}
        {hadith.source && (
          <span className="hadith-source">المصدر: {hadith.source}</span>
        )}
        {hadith.category && (
          <span className="hadith-category-badge">{hadith.category}</span>
        )}
        {hadith.isPlaceholder && (
          <span className="hadith-source" title="سيتم استبداله ببيانات موثّقة">
            🔖 نموذجي
          </span>
        )}
      </div>
    </article>
  );
}
