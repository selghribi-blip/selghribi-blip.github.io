import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/helpers';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!form.password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate('/');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-title">🕌 ذكريات النبي ﷺ</h1>
        <p className="auth-subtitle">تسجيل الدخول إلى حسابك</p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input${error && !form.email ? ' error' : ''}`}
              placeholder="example@mail.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              dir="ltr"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="أدخل كلمة المرور"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'جاري الدخول…' : 'دخول'}
          </button>
        </form>

        <p className="auth-link-row">
          ليس لديك حساب؟{' '}
          <Link to="/register">إنشاء حساب جديد</Link>
        </p>
      </div>
    </div>
  );
}
