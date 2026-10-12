import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ------------------------------------------------------------------
 * Request interceptor — attach JWT to every outgoing request
 * ------------------------------------------------------------------ */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hh_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ------------------------------------------------------------------
 * Response interceptor — normalise errors + auto-logout on 401
 * ------------------------------------------------------------------ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Build a friendly message — never leak raw stack traces
    let message =
      data?.message ||
      data?.error ||
      error.message ||
      'Something went wrong. Please try again.';

    // Rate limit — show a meaningful message
    if (status === 429) {
      message = 'Too many attempts. Please wait a few minutes and try again.';
    }

    // Auto-logout on expired/invalid token (but NOT on the login/register calls themselves)
    const isAuthCall = error.config?.url?.includes('/auth/');
    if (status === 401 && !isAuthCall) {
      localStorage.removeItem('hh_token');
      localStorage.removeItem('hh_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      status: status || 0,
      message,
      original: error,
    });
  }
);

export default api;