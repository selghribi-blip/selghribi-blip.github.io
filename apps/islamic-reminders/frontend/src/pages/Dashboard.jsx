import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

function ReminderCard({ hadith }) {
  return (
    <div className="reminder-card">
      <p className="reminder-card__text">"{hadith.text}"</p>
      <div className="reminder-card__meta">
        <span>📖 {hadith.source}</span>
        {hadith.narrator && <span>👤 {hadith.narrator}</span>}
        {hadith.grade && <span className="reminder-card__grade">✅ {hadith.grade}</span>}
      </div>
      {hadith.categories?.length > 0 && (
        <div className="reminder-card__categories">
          {hadith.categories.map((cat) => (
            <span key={cat._id || cat.slug} className="badge">{cat.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [todayData, setTodayData] = useState(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState('');

  const [searchQ, setSearchQ] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [categories, setCategories] = useState([]);

  const loadToday = useCallback(async () => {
    setTodayLoading(true);
    setTodayError('');
    try {
      const { data } = await api.get('/reminders/today');
      setTodayData(data);
    } catch (err) {
      setTodayError(err.response?.data?.error || 'Failed to load today\'s reminders.');
    } finally {
      setTodayLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, [loadToday]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQ && !searchCategory) return;
    setSearchLoading(true);
    setSearchError('');
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('q', searchQ);
      if (searchCategory) params.set('category', searchCategory);
      const { data } = await api.get(`/hadith/search?${params}`);
      setSearchResults(data);
    } catch (err) {
      setSearchError(err.response?.data?.error || 'Search failed.');
    } finally {
      setSearchLoading(false);
    }
  };

  const gregorianDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="dashboard">
      {/* Hijri date banner */}
      {todayData?.hijriDate && (
        <div className="hijri-banner">
          <div>
            <div className="hijri-banner__date">
              {todayData.hijriDate.day} {todayData.hijriDate.monthName} {todayData.hijriDate.year} AH
            </div>
            <div className="hijri-banner__gregorian">{gregorianDate}</div>
          </div>
          <div className="hijri-banner__crescent">🌙</div>
        </div>
      )}

      {/* Today's reminders */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="section-title">📿 Today's Reminders</div>
        {todayLoading && (
          <div className="loading"><div className="spinner" /></div>
        )}
        {todayError && <div className="alert alert-error">{todayError}</div>}
        {!todayLoading && !todayError && todayData?.reminders?.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">📖</div>
            <p>No reminders found. <a href="/preferences">Update your preferences</a> to see more.</p>
          </div>
        )}
        {!todayLoading && todayData?.reminders?.map((h) => (
          <ReminderCard key={h._id} hadith={h} />
        ))}
      </div>

      {/* Search */}
      <div>
        <div className="section-title">🔍 Search Hadith by Topic</div>
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="e.g. patience, gratitude, anxiety…"
          />
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary" disabled={searchLoading}>
            {searchLoading ? 'Searching…' : 'Search'}
          </button>
          {searchResults && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSearchResults(null)}
            >
              Clear
            </button>
          )}
        </form>

        {searchError && <div className="alert alert-error">{searchError}</div>}

        {searchResults !== null && (
          <>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {searchResults.total} result{searchResults.total !== 1 ? 's' : ''} found
            </p>
            {searchResults.results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">🔎</div>
                <p>No hadith matched your search. Try different keywords.</p>
              </div>
            ) : (
              searchResults.results.map((h) => <ReminderCard key={h._id} hadith={h} />)
            )}
          </>
        )}
      </div>
    </div>
  );
}
