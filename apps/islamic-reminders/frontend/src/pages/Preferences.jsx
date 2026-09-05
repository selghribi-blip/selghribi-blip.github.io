import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Preferences() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedSlugs, setSelectedSlugs] = useState([]);
  const [notificationTime, setNotificationTime] = useState('07:00');
  const [locale, setLocale] = useState('en');
  const [situation, setSituation] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data);

        if (user?.preferences) {
          const slugs = (user.preferences.categories || []).map((c) => c.slug || c);
          setSelectedSlugs(slugs);
          setNotificationTime(user.preferences.notificationTime || '07:00');
          setLocale(user.preferences.locale || 'en');
        }
      } catch {
        setError('Failed to load categories.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const toggleCategory = (slug) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/preferences', {
        categories: selectedSlugs,
        notificationTime,
        locale,
        situation: situation.trim() || undefined,
      });
      await refreshUser();
      setSuccess('Preferences saved successfully!');
      setSituation('');
    } catch (err) {
      const errData = err.response?.data;
      setError(errData?.errors?.[0]?.msg || errData?.error || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="preferences">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="preferences">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--primary-dark)' }}>⚙️ Preferences</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back</button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSave}>
        {/* Category selection */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title" style={{ marginBottom: '1rem' }}>📚 Topics of Interest</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Select the topics you care most about. Today's reminders will be filtered by these categories.
          </p>
          <div className="categories-grid">
            {categories.map((cat) => {
              const isSelected = selectedSlugs.includes(cat.slug);
              return (
                <label
                  key={cat._id}
                  className={`category-checkbox${isSelected ? ' selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCategory(cat.slug)}
                  />
                  <span>{cat.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Situation (keyword matching) */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title" style={{ marginBottom: '0.5rem' }}>🤲 Your Current Situation (optional)</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Describe what you are going through (e.g. "I'm struggling with anxiety and debt"). 
            We'll match relevant categories automatically.
          </p>
          <div className="form-group">
            <textarea
              rows={3}
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Describe your situation…"
              maxLength={500}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Notification time + locale */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title" style={{ marginBottom: '1rem' }}>🔔 Notification Settings</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="notifTime">Daily reminder time</label>
              <input
                id="notifTime"
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="locale">Language</label>
              <select id="locale" value={locale} onChange={(e) => setLocale(e.target.value)}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : '💾 Save Preferences'}
        </button>
      </form>
    </div>
  );
}
