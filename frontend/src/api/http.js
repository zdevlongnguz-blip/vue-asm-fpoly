import axios from 'axios';

const TOKEN_KEY = 'sm_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
});

// Gắn token vào mọi request
http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Chuẩn hóa lỗi + tự đăng xuất khi token hết hạn
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Không kết nối được máy chủ';

    if (status === 401 && !error.config.url.includes('/auth/login')) {
      tokenStorage.clear();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }

    return Promise.reject({ status, message, errors: error.response?.data?.errors });
  }
);

export default http;
