import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../services/api/apiSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
