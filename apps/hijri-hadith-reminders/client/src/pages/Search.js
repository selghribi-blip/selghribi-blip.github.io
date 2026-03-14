import React, { useState, useCallback } from 'react';
import api from '../utils/api';
import { extractError, toArabicNumerals } from '../utils/helpers';
import HadithCard from '../components/HadithCard';

const CATEGORIES = [
  'العبادة', 'الأخلاق', 'الأسرة', 'المعاملات',
  'الصحة', 'العلم', 'الصبر', 'الدعاء', 'الرزق', 'اليوم الآخر'
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const search = useCallback(
    async (currentPage = 1) => {
      setError('');
      setLoading(true);
      setSearched(true);
      try {
        const params = { page: currentPage };
        if (query.trim()) params.q = query.trim();
        if (category) params.category = category;

        const res = await api.get('/hadith/search', { params });
        setResults(res.data.results);
        setTotal(res.data.total);
        setPage(res.data.page);
        setPages(res.data.pages);
      } catch (err) {
        setError(extractError(err));
      } finally {
        setLoading(false);
      }
    },
    [query, category]
  );

  function handleSubmit(e) {
    e.preventDefault();
    search(1);
  }

  function handleCategoryToggle(cat) {
    setCategory((prev) => (prev === cat ? '' : cat));
  }

  function handlePageChange(newPage) {
    setPage(newPage);
    search(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page-container">
      <h1 className="page-title">البحث في الأحاديث</h1>

      {/* ── شريط البحث ── */}
      <form onSubmit={handleSubmit}>
        <div className="search-bar">
          <input
            type="search"
            className="form-input"
            placeholder="ابحث في نصوص الأحاديث…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="حقل البحث"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '…' : 'بحث'}
          </button>
        </div>
      </form>

      {/* ── فلتر التصنيفات ── */}
      <div className="filter-row" role="group" aria-label="تصفية حسب التصنيف">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-chip${category === cat ? ' active' : ''}`}
            onClick={() => handleCategoryToggle(cat)}
            aria-pressed={category === cat}
          >
            {cat}
          </button>
        ))}
        {category && (
          <button
            type="button"
            className="filter-chip"
            onClick={() => setCategory('')}
            style={{ borderColor: '#c0392b', color: '#c0392b' }}
          >
            ✕ إلغاء الفلتر
          </button>
        )}
      </div>

      {/* ── رسالة خطأ ── */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* ── النتائج ── */}
      {loading && <div className="spinner">جاري البحث…</div>}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>لا توجد نتائج مطابقة للبحث</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p style={{ marginBottom: '1rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            تم العثور على {toArabicNumerals(total)} نتيجة
          </p>
          {results.map((hadith) => (
            <HadithCard key={hadith._id} hadith={hadith} />
          ))}

          {/* ── ترقيم الصفحات ── */}
          {pages > 1 && (
            <div className="pagination" role="navigation" aria-label="ترقيم الصفحات">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                aria-label="الصفحة السابقة"
              >
                ‹ السابقة
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={page === p ? 'current' : ''}
                  aria-current={page === p ? 'page' : undefined}
                >
                  {toArabicNumerals(p)}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pages}
                aria-label="الصفحة التالية"
              >
                التالية ›
              </button>
            </div>
          )}
        </>
      )}

      {!searched && (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p>أدخل كلمة بحث أو اختر تصنيفاً للبدء</p>
        </div>
      )}
    </div>
  );
}
