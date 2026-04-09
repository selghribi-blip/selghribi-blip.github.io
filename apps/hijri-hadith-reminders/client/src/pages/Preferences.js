import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { extractError, toArabicNumerals } from '../utils/helpers';

const ALL_CATEGORIES = [
  'العبادة', 'الأخلاق', 'الأسرة', 'المعاملات',
  'الصحة', 'العلم', 'الصبر', 'الدعاء', 'الرزق', 'اليوم الآخر'
];

export default function Preferences() {
  const { user, updateUser } = useAuth();
  const [selected, setSelected] = useState(
    user?.preferences?.categories || ['العبادة', 'الأخلاق', 'الأسرة']
  );
  const [notifications, setNotifications] = useState(
    user?.preferences?.notifications ?? true
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function toggleCategory(cat) {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setMessage('');
    setError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (selected.length === 0) {
      setError('يجب اختيار تصنيف واحد على الأقل');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/preferences', { categories: selected, notifications });
      updateUser({ preferences: res.data.preferences });
      setMessage('تم حفظ التفضيلات بنجاح ✓');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">تفضيلاتي</h1>

      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-mid)' }}>
            التصنيفات التي تهمّك
          </h2>
          <div className="category-grid">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-toggle${selected.includes(cat) ? ' selected' : ''}`}
                onClick={() => toggleCategory(cat)}
                aria-pressed={selected.includes(cat)}
              >
                {selected.includes(cat) ? '✓ ' : ''}{cat}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
            اختر {toArabicNumerals(selected.length === 0 ? 0 : selected.length)} من {toArabicNumerals(ALL_CATEGORIES.length)} تصنيف
          </p>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-mid)' }}>
            التنبيهات
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--green-dark)' }}
            />
            <span style={{ fontSize: '0.95rem' }}>تفعيل تنبيهات التذكير اليومي</span>
          </label>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving || selected.length === 0}
        >
          {saving ? 'جاري الحفظ…' : 'حفظ التفضيلات'}
        </button>
      </form>
    </div>
  );
}
