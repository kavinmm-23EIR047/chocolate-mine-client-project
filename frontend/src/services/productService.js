import api from '../utils/api';

const productService = {
  getAll: (params) => api.get('/products', { params }),
  getOccasionProducts: (params) => api.get('/products', { params: { ...params, limit: 4 } }),
  getFeatured: (params) => api.get('/products/featured', { params }),
  search: (params) => api.get('/products/search', { params }),
  getByCategory: (category, params) => api.get(`/products/category/${category}`, { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  create: (formData) => api.post('/products', formData),
  update: (id, formData) => api.put(`/products/${id}`, formData),
  delete: (id) => api.delete(`/products/${id}`),
  validateCoupon: (productId, code) =>
    api.post('/coupon/validate', { productId, code }),
  getActiveAddons: () => api.get('/addons/active'),
};

export default productService;