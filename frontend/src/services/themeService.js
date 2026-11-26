import api from '../utils/api';

const themeService = {
  // Public
  getActiveTheme: () => api.get('/themes/active'),

  // Admin
  getThemes: () => api.get('/admin/themes'),
  createTheme: (data) => api.post('/admin/themes', data),
  updateTheme: (id, data) => api.patch(`/admin/themes/${id}`, data),
  toggleEnable: (id, isEnabled) => api.patch(`/admin/themes/${id}/enable`, isEnabled !== undefined ? { isEnabled } : {}),
  toggleVisible: (id, isVisible) => api.patch(`/admin/themes/${id}/visible`, isVisible !== undefined ? { isVisible } : {}),
  deleteTheme: (id) => api.delete(`/admin/themes/${id}`),
};

export default themeService;
