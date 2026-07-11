import { apiSlice } from '../services/api/apiSlice';

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        
        // Pagination
        if (params.page) queryParams.set('page', params.page);
        if (params.limit) queryParams.set('limit', params.limit);
        
        // Filters - Support all filter types
        if (params.category && params.category !== 'all') {
          queryParams.set('category', params.category);
        }
        if (params.subCategory) queryParams.set('subCategory', params.subCategory);
        if (params.occasion && params.occasion !== 'all') {
          queryParams.set('occasion', params.occasion);
        }
        if (params.rating && params.rating > 0) {
          queryParams.set('rating', params.rating);
        }
        if (params.minPrice) queryParams.set('minPrice', params.minPrice);
        if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice);
        if (params.sort) queryParams.set('sort', params.sort);
        if (params.search) queryParams.set('search', params.search);
        if (params.bestseller) queryParams.set('bestseller', params.bestseller);
        if (params.featured) queryParams.set('featured', params.featured);
        if (params.location) queryParams.set('location', params.location);
        
        // For debugging - log the URL
        const url = `/products?${queryParams.toString()}`;
        console.log('🔍 Fetching products with URL:', url);
        
        return url;
      },
      providesTags: ['Product'],
      // Keep the data fresh for 60 seconds
      keepUnusedDataFor: 60,
    }),
    
    getProductBySlug: builder.query({
      query: (slug) => `/products/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Product', id: slug }],
    }),
    
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    
    // New endpoint for getting products with all filters from the server
    getFilteredProducts: builder.query({
      query: (filters = {}) => {
        const queryParams = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
          const value = filters[key];
          if (value !== undefined && value !== null && value !== '' && value !== 'all') {
            if (Array.isArray(value)) {
              queryParams.set(key, value.join(','));
            } else {
              queryParams.set(key, String(value));
            }
          }
        });
        
        return `/products/filter?${queryParams.toString()}`;
      },
      providesTags: ['Product'],
    }),
    
    // Get categories with product counts
    getCategoriesWithCounts: builder.query({
      query: () => '/categories/with-counts',
      providesTags: ['Category'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useGetProductByIdQuery,
  useGetFilteredProductsQuery,
  useGetCategoriesWithCountsQuery,
} = productApi;