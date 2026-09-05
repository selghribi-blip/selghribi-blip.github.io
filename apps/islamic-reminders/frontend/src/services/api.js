import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Inject token into every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ir_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ir_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
