import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin + '/api/v1' : 'http://localhost:5000/api/v1'),
  withCredentials: true,
});

/* ----------------------------------------
   REQUEST INTERCEPTOR
---------------------------------------- */
api.interceptors.request.use(
  (config) => {
    let token = sessionStorage.getItem('token') || localStorage.getItem('token');

    // Fallback for OAuth sessions
    if (!token) {
      const authUser = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');
      if (authUser) {
        try {
          const parsed = JSON.parse(authUser);
          if (parsed?.token) {
            token = parsed.token;
          }
        } catch (e) {
          console.error('Failed to parse auth_user in interceptor', e);
        }
      }
    }

    // ✅ Only inject Authorization if not already provided manually
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Preserve FormData behavior
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ----------------------------------------
   RESPONSE INTERCEPTOR
---------------------------------------- */

const SKIP_401_REDIRECT_ROUTES = [
  '/payment/create-order',
  '/payment/verify',
  '/payment/log-failure',
  '/auth/me',
  '/auth/login',
  '/auth/signup'
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    if (status === 401) {
      const shouldSkip = SKIP_401_REDIRECT_ROUTES.some((route) =>
        requestUrl.includes(route)
      );

      // Don't redirect for auth-check routes or payment routes
      if (!shouldSkip) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        if (
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/register'
        ) {
          window.location.href = '/login';
        }
      }
    }

    if (status === 403) {
      console.error('Access forbidden:', error.response?.data?.message);
    }

    if (status === 404) {
      console.error('Route not found:', error.response?.data?.message);
    }

    if (status === 500) {
      console.error('Server error:', error.response?.data?.message);
    }

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Unknown error occurred';

    const normalizedError = new Error(errorMessage);
    normalizedError.response = error.response;
    normalizedError.status = status;
    normalizedError.data = error.response?.data;

    return Promise.reject(normalizedError);
  }
);

/* ----------------------------------------
   FORM DATA HELPER
---------------------------------------- */
export const formDataRequest = async (
  method,
  url,
  data = {},
  options = {}
) => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    const value = data[key];

    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, item));
      } else if (
        typeof value === 'object' &&
        !(value instanceof File)
      ) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });

  return api({
    method,
    url,
    data: formData,
    ...options,
  });
};

/* ----------------------------------------
   FILE UPLOAD HELPER
---------------------------------------- */
export const uploadFile = async (
  url,
  file,
  additionalData = {}
) => {
  const formData = new FormData();

  formData.append('image', file);

  Object.keys(additionalData).forEach((key) => {
    if (
      additionalData[key] !== null &&
      additionalData[key] !== undefined
    ) {
      formData.append(key, additionalData[key]);
    }
  });

  return api.post(url, formData);
};

export default api;