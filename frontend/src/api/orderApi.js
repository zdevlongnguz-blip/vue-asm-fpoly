import http from './http.js';

export const orderApi = {
  list: (params) => http.get('/orders', { params }),
  get: (id) => http.get(`/orders/${id}`),
  create: (data) => http.post('/orders', data),
  updateStatus: (id, status) => http.patch(`/orders/${id}/status`, { status }),
  remove: (id) => http.delete(`/orders/${id}`),
};

export const customerApi = {
  list: (params) => http.get('/customers', { params }),
  create: (data) => http.post('/customers', data),
};
