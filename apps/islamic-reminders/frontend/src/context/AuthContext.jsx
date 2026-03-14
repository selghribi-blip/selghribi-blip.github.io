import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ir_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async (jwt) => {
    if (!jwt) { setLoading(false); return; }
    try {
      const { data } = await api.get('/me', {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setUser(data);
    } catch {
      setToken(null);
      localStorage.removeItem('ir_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(token); }, [token, loadMe]);

  const login = (jwt, userData) => {
    localStorage.setItem('ir_token', jwt);
    setToken(jwt);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ir_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser: () => loadMe(token) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
