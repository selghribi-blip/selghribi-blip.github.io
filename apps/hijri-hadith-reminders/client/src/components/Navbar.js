import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar" role="navigation" aria-label="القائمة الرئيسية">
      <Link to="/" className="navbar-brand">
        🕌 ذكريات النبي ﷺ
      </Link>

      <ul className="navbar-links">
        {user ? (
          <>
            <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                الرئيسية
              </NavLink>
            </li>
            <li>
              <NavLink to="/search" className={({ isActive }) => (isActive ? 'active' : '')}>
                البحث
              </NavLink>
            </li>
            <li>
              <NavLink to="/preferences" className={({ isActive }) => (isActive ? 'active' : '')}>
                التفضيلات
              </NavLink>
            </li>
            <li>
              <span className="navbar-user">مرحباً، {user.name}</span>
            </li>
            <li>
              <button className="navbar-logout" onClick={handleLogout}>
                خروج
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login">دخول</NavLink>
            </li>
            <li>
              <NavLink to="/register">تسجيل</NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
