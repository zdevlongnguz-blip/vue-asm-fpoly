import http from './http.js';

export const authApi = {
  login: (email, password) => http.post('/auth/login', { email, password }),
  me: () => http.get('/auth/me'),
};
