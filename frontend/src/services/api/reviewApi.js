import { apiSlice } from './apiSlice';

export const reviewApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLatestReviews: builder.query({
      query: () => '/reviews/latest',
      providesTags: ['Review'],
    }),
    getProductReviews: builder.query({
      query: (productId) => `/reviews/product/${productId}`,
      providesTags: (result, error, productId) => [{ type: 'Review', id: productId }],
    }),
    getUserReviews: builder.query({
      query: () => '/reviews/my-reviews',
      providesTags: ['Review'],
    }),
    createReview: builder.mutation({
      query: (reviewData) => ({
        url: '/reviews',
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const {
  useGetLatestReviewsQuery,
  useGetProductReviewsQuery,
  useGetUserReviewsQuery,
  useCreateReviewMutation,
} = reviewApi;
