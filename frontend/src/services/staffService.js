import api, { getApiBaseUrl } from '../utils/api';

const getAuthenticatedUrl = (path) => {
  const apiBaseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  const url = `${apiBaseUrl}/${normalizedPath}`;
  let token = null;

  try {
    token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      const authUser = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');
      token = authUser ? JSON.parse(authUser)?.token : null;
    }
  } catch (error) {
    console.warn('Could not read the session token for the print link:', error);
  }

  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
};

const staffService = {
  /* ----------------------------------------
     Dashboard & Stats
  ---------------------------------------- */
  getDashboard: () => api.get('/staff/dashboard'),
  
  /* ----------------------------------------
     Orders Management
  ---------------------------------------- */
  getNewOrders: () => api.get('/staff/orders/new'),
  getProcessingOrders: () => api.get('/staff/orders/processing'),
  getPackedOrders: () => api.get('/staff/orders/packed'),
  getOutForDeliveryOrders: () => api.get('/staff/orders/out-for-delivery'),
  getDeliveredOrders: () => api.get('/staff/orders/delivered'),
  getAllOrders: (params) => api.get('/orders', { params }),
  
  /* ----------------------------------------
     Status Update - Direct transitions (NO OTP)
     Flow: confirmed → processing → packed → out_for_delivery → delivered
  ---------------------------------------- */
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  updateKitchenStatus: (id, status) => api.patch(`/staff/orders/${id}/kitchen-status`, { status }),
  
  /* ----------------------------------------
     Order Details
  ---------------------------------------- */
  getOrderDetails: (orderId) => api.get(`/staff/orders/${orderId}`),
  
  /* ----------------------------------------
     KOT (Kitchen Order Ticket)
  ---------------------------------------- */
  getKOTData: (id) => api.get(`/staff/orders/${id}/kot`),
  getKOTPrintUrl: (id) => getAuthenticatedUrl(`/staff/orders/${id}/kot/print`),
  printKOT: (id) => {
    window.open(getAuthenticatedUrl(`/staff/orders/${id}/kot/print`), '_blank', 'noopener,noreferrer');
  },
  getInvoiceUrl: (id) => getAuthenticatedUrl(`/orders/${id}/invoice`),
  markKOTPrinted: (id) => api.patch(`/staff/orders/${id}/print-kot`),

  /* ----------------------------------------
     In-Shop Orders (walk-in / counter sales)
  ---------------------------------------- */
  createInShopOrder: (data) => api.post('/staff/orders/in-shop', data),
  getInShopOrders: () => api.get('/staff/orders/in-shop'),

  /* ----------------------------------------
     Delivery OTP Verification
  ---------------------------------------- */
  sendDeliveryOtp: (orderId, channel = 'both') => api.post(`/orders/${orderId}/delivery-otp/send`, { channel }),
  verifyDeliveryOtp: (orderId, otp) => api.post(`/orders/${orderId}/delivery-otp/verify`, { otp }),
};

export default staffService;
