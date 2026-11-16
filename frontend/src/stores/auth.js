import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/authApi.js';
import { tokenStorage } from '@/api/http.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(tokenStorage.get());

  const isLoggedIn = computed(() => Boolean(token.value && user.value));
  const isAdmin = computed(() => user.value?.role === 'admin');

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    token.value = res.token;
    user.value = res.user;
    tokenStorage.set(res.token);
  };

  // Gọi khi tải lại trang để lấy lại thông tin user từ token
  const fetchMe = async () => {
    if (!token.value) return;
    try {
      const res = await authApi.me();
      user.value = res.user;
    } catch {
      logout();
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    tokenStorage.clear();
  };

  const hasRole = (...roles) => roles.includes(user.value?.role);

  return { user, token, isLoggedIn, isAdmin, login, fetchMe, logout, hasRole };
});
