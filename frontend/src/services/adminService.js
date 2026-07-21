import api from '../utils/api';

const adminService = {
  /* ----------------------------------------
     Dashboard
  ---------------------------------------- */
  getDashboard: () => api.get('/admin/dashboard'),

  /* ----------------------------------------
     Export Data
  ---------------------------------------- */
  downloadMasterExport: () => api.get('/export/download', { responseType: 'blob' }),
  syncMasterExport: () => api.post('/export/sync'),

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
  getCategories: (params) => api.get('/categories', { params }),

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
  createCustomCakeFlavour: (data) => api.post('/custom-cakes/flavours', data),
  updateCustomCakeFlavour: (id, data) => api.put(`/custom-cakes/flavours/${id}`, data),

  
  /* ----------------------------------------
     Custom Cake Themes
  ---------------------------------------- */
  getCustomCakeThemes: () => api.get(`/custom-cakes/themes?t=${Date.now()}`),
  createCustomCakeTheme: (data) => api.post('/custom-cakes/themes', data),
  updateCustomCakeTheme: (id, data) => api.put(`/custom-cakes/themes/${id}`, data),
  deleteCustomCakeTheme: (id) => api.delete(`/custom-cakes/themes/${id}`),

  // --- Theme Flavours (Isolated) ---
  addCustomCakeThemeFlavour: (themeId, data) => api.post(`/custom-cakes/themes/${themeId}/flavours`, data),
  updateCustomCakeThemeFlavour: (themeId, flavourId, data) => api.put(`/custom-cakes/themes/${themeId}/flavours/${flavourId}`, data),
  deleteCustomCakeThemeFlavour: (themeId, flavourId) => api.delete(`/custom-cakes/themes/${themeId}/flavours/${flavourId}`),

  addCustomCakeThemeColor: (themeId, data) => api.post(`/custom-cakes/themes/${themeId}/colors`, data),
  updateCustomCakeThemeColor: (themeId, colorId, data) => api.put(`/custom-cakes/themes/${themeId}/colors/${colorId}`, data),
  deleteCustomCakeThemeColor: (themeId, colorId) => api.delete(`/custom-cakes/themes/${themeId}/colors/${colorId}`),
  uploadCustomCakeThemeColorImages: (themeId, colorId, formData) => api.post(`/custom-cakes/themes/${themeId}/colors/${colorId}/images`, formData),
  applyCustomCakeThemeColorToAll: (themeId, colorId) => api.post(`/custom-cakes/themes/${themeId}/colors/${colorId}/apply-to-all`),

  /* ----------------------------------------
     Custom Cake Colors
  ---------------------------------------- */
  getCustomCakeColors: () => api.get(`/custom-cakes/colors?t=${Date.now()}`),
  createCustomCakeColor: (data) => api.post('/custom-cakes/colors', data),
  updateCustomCakeColor: (id, data) => api.put(`/custom-cakes/colors/${id}`, data),
  deleteCustomCakeColor: (id) => api.delete(`/custom-cakes/colors/${id}`),

  /* ----------------------------------------
     Custom Cake Theme Colors (Images)
  ---------------------------------------- */
  getCustomCakeThemeColors: () => api.get('/custom-cakes/theme-colors'),
  createCustomCakeThemeColor: (formData) => api.post('/custom-cakes/theme-colors', formData),
  deleteCustomCakeThemeColor: (id) => api.delete(`/custom-cakes/theme-colors/${id}`),

  /* ----------------------------------------
     Custom Cake Flavours
  ---------------------------------------- */
  getCustomCakeFlavours: () => api.get(`/custom-cakes/flavours?t=${Date.now()}`),
  createCustomCakeFlavour: (data) => api.post('/custom-cakes/flavours', data),
  updateCustomCakeFlavour: (id, data) => api.put(`/custom-cakes/flavours/${id}`, data),
  deleteCustomCakeFlavour: (id) => api.delete(`/custom-cakes/flavours/${id}`),




  /* ----------------------------------------
     Review Management
  ---------------------------------------- */
  getReviews: () => api.get('/admin/reviews'),
  updateReview: (id, data) => api.patch(`/admin/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),

  /* ----------------------------------------
     Social Media Dashboard
  ---------------------------------------- */
  getGoogleAnalytics: () => api.get('/admin/social-media/google'),
  getInstagramStats: () => api.get('/admin/social-media/instagram'),

  /* ----------------------------------------
     Addon Management
  ---------------------------------------- */
  getAddons: () => api.get('/addons'),
  createAddon: (formData) => api.post('/addons', formData),
  updateAddon: (id, formData) => api.put(`/addons/${id}`, formData),
  deleteAddon: (id) => api.delete(`/addons/${id}`),
};

export default adminService;