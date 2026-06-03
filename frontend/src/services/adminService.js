import api from '../utils/api';

const adminService = {
  /* ----------------------------------------
     Dashboard
  ---------------------------------------- */
  getDashboard: () => api.get('/admin/dashboard'),

  /* ----------------------------------------
     Staff Management
  ---------------------------------------- */
  createStaff: (data) => api.post('/admin/staff/create', data),
  getAllStaff: () => api.get('/admin/staff'),
  updateStaff: (id, data) => api.patch(`/admin/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`),

  /* ----------------------------------------
     Order Management
  ---------------------------------------- */
  getOrders: () => api.get('/admin/orders'),
  
  // ✅ ADD THIS - Get single order details for admin
  getOrder: (id) => api.get(`/admin/orders/${id}`),

  updateOrderStatus: (id, status) =>
    api.patch(`/admin/orders/${id}/status`, { status }),

  downloadInvoice: (id) =>
    api.get(`/admin/orders/${id}/invoice`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf'
      }
    }),

  resendInvoice: (id) =>
    api.post(`/admin/orders/${id}/resend-invoice`),

  /* ----------------------------------------
     Category Management
  ---------------------------------------- */
  getCategories: () => api.get('/categories'),

  createCategory: (formData) =>
    api.post('/categories', formData),

  updateCategory: (id, formData) =>
    api.put(`/categories/${id}`, formData),

  deleteCategory: (id) =>
    api.delete(`/categories/${id}`),

  /* ----------------------------------------
     Occasion Management
  ---------------------------------------- */
  getOccasions: () => api.get('/occasions'),

  createOccasion: (formData) =>
    api.post('/occasions', formData),

  updateOccasion: (id, formData) =>
    api.put(`/occasions/${id}`, formData),

  deleteOccasion: (id) =>
    api.delete(`/occasions/${id}`),

  /* ----------------------------------------
     Banner Management
  ---------------------------------------- */
  getBanners: () => api.get('/banners'),
  
  createBanner: (formData) =>
    api.post('/banners', formData),

  updateBanner: (id, formData) =>
    api.patch(`/banners/${id}`, formData),

  deleteBanner: (id) =>
    api.delete(`/banners/${id}`),

  toggleBanner: (id) =>
    api.patch(`/banners/${id}/toggle`),

  /* ----------------------------------------
     Custom Cake Flavours
  ---------------------------------------- */
  getCustomCakeFlavours: () => api.get('/custom-cakes/flavours/admin'),
  createCustomCakeFlavour: (data) => api.post('/custom-cakes/flavours', data),
  updateCustomCakeFlavour: (id, data) => api.put(`/custom-cakes/flavours/${id}`, data),
  deleteCustomCakeFlavour: (id) => api.delete(`/custom-cakes/flavours/${id}`),
  seedCustomCakeFlavours: () => api.post('/custom-cakes/flavours/seed')
};


export default adminService;