import axios from 'axios';

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isLocalUrl = typeof envUrl === 'string' && /(^|\/\/)(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(envUrl);

  if (import.meta.env.PROD && isLocalUrl) {
    console.error('Production VITE_API_URL points to a local address; using the same-origin API fallback.');
    return window.location.origin + '/api/v1';
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (!envUrl || envUrl.includes('localhost') || envUrl.startsWith('http://')) {
      return window.location.origin + '/api/v1';
    }
  }
  return envUrl || (import.meta.env.PROD ? window.location.origin + '/api/v1' : 'http://localhost:5001/api/v1');
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 15000,
});

/* ----------------------------------------
   REQUEST INTERCEPTOR
---------------------------------------- */
api.interceptors.request.use(
  (config) => {
    let token = null;
    let authUser = null;
    try {
      token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        authUser = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');
      }
    } catch (err) {
      console.warn('Storage access restricted:', err);
    }

    // Fallback for OAuth sessions
    if (!token && authUser) {
      try {
        const parsed = JSON.parse(authUser);
        if (parsed?.token) {
          token = parsed.token;
        }
      } catch (e) {
        console.error('Failed to parse auth_user in interceptor', e);
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

const AUTH_EXPIRY_ROUTES = ['/auth/me'];
let authExpiryEventSent = false;

api.interceptors.response.use(
  (response) => {
    if (AUTH_EXPIRY_ROUTES.some((route) => (response.config?.url || '').includes(route))) {
      authExpiryEventSent = false;
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    if (status === 401) {
      const shouldSkip = SKIP_401_REDIRECT_ROUTES.some((route) =>
        requestUrl.includes(route)
      );

      // Only auth verification is definitive. Endpoint-specific 401s must
      // remain local errors and must not log the whole customer out.
      const isAuthVerification = AUTH_EXPIRY_ROUTES.some((route) => requestUrl.includes(route));
      if (!shouldSkip && isAuthVerification && !authExpiryEventSent) {
        authExpiryEventSent = true;
        window.dispatchEvent(new Event('auth-expired'));
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
