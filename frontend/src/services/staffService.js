import api from '../utils/api';

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
  printKOT: (id) => {
    const url = `${import.meta.env.VITE_API_URL}/staff/orders/${id}/kot/print`;
    window.open(url, '_blank', 'width=400,height=600');
  },
  markKOTPrinted: (id) => api.patch(`/staff/orders/${id}/print-kot`),
};

export default staffService;