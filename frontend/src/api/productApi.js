import http from './http.js';

export const productApi = {
  list: (params) => http.get('/products', { params }),
  get: (id) => http.get(`/products/${id}`),
  create: (data) => http.post('/products', data),
  update: (id, data) => http.put(`/products/${id}`, data),
  remove: (id) => http.delete(`/products/${id}`),
};

export const categoryApi = {
  list: () => http.get('/categories'),
};
