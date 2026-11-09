import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
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
 * Retry once after access-token expiry using the HttpOnly refresh cookie.
 * One shared refresh call avoids duplicate rotations from parallel requests.
 * ------------------------------------------------------------------ */
let refreshPromise = null;

function clearLocalSession() {
  localStorage.removeItem('hh_token');
  localStorage.removeItem('hh_user');
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const status = error.response?.status;
    const data = error.response?.data;
    const isAuthCall = config.url?.includes('/auth/');

    if (status === 401 && !isAuthCall && !config._retry && localStorage.getItem('hh_token')) {
      config._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
            withCredentials: true,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          }).finally(() => { refreshPromise = null; });
        }
        const { data: refreshed } = await refreshPromise;
        localStorage.setItem('hh_token', refreshed.token);
        config.headers = { ...config.headers, Authorization: `Bearer ${refreshed.token}` };
        return api(config);
      } catch {
        clearLocalSession();
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
    } else if (status === 401 && !isAuthCall) {
      clearLocalSession();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }

    const message = status === 429
      ? 'Too many attempts. Please wait a few minutes and try again.'
      : data?.message || data?.error || data?.errors?.[0]?.msg
        || error.message || 'Something went wrong. Please try again.';
    return Promise.reject({ status: status || 0, message, original: error });
  }
);

export default api;
