import { apiSlice } from './apiSlice';

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: (result) => {
        const list = result?.data;
        return Array.isArray(list)
          ? [
              ...list.map(({ _id }) => ({ type: 'Product', id: _id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }];
      },
    }),
    getProductBySlug: builder.query({
      query: (slug) => `/products/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Product', id: result?.data?._id || slug }],
    }),
    // In real-time sync, we might not need an explicit "updateStock" query 
    // because socket events will update the cache directly.
  }),
});

export const {
  useGetProductsQuery,
  useGetProductBySlugQuery,
} = productApi;
