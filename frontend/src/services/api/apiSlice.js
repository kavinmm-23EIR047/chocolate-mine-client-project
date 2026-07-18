import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin + '/api/v1' : 'http://localhost:5000/api/v1'),
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Product', 'Order', 'User', 'Cart'],
  endpoints: (builder) => ({}),
});
