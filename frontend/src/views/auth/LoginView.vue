<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { useToastStore } from '@/stores/toast.js';

const auth = useAuthStore();
const toast = useToastStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: '', password: '' });
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');

const submit = async () => {
  error.value = '';
  if (!form.email || !form.password) {
    error.value = 'Vui lòng nhập email và mật khẩu';
    return;
  }
  loading.value = true;
  try {
    await auth.login(form.email.trim(), form.password);
    toast.success(`Xin chào, ${auth.user.name}!`);
    router.push(route.query.redirect || { name: 'products' });
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const fillDemo = (role) => {
  form.email = role === 'admin' ? 'admin@shop.com' : 'staff@shop.com';
  form.password = '123456';
};
</script>

<template>
  <div class="login-page min-vh-100 d-flex align-items-center justify-content-center p-3">
    <div class="card login-card w-100">
      <div class="card-body p-4 p-md-5">
        <div class="text-center mb-4">
          <span class="logo mb-3"><i class="bi bi-cart3" /></span>
          <h1 class="h4 fw-bold mb-1">Sales<span class="text-primary">Manager</span></h1>
          <p class="text-muted mb-0">Đăng nhập để tiếp tục</p>
        </div>

        <div v-if="error" class="alert alert-danger py-2 small">
          <i class="bi bi-exclamation-circle me-1" />{{ error }}
        </div>

        <form novalidate @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label" for="email">Email</label>
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-envelope" /></span>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-control"
                placeholder="you@shop.com"
                autocomplete="username"
                autofocus
              />
            </div>
          </div>
          <div class="mb-4">
            <label class="form-label" for="password">Mật khẩu</label>
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-lock" /></span>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                placeholder="••••••"
                autocomplete="current-password"
              />
              <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword">
                <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'" />
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-100 py-2" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-1" />
            Đăng nhập
          </button>
        </form>

        <div class="demo mt-4 pt-3 border-top small text-muted text-center">
          Tài khoản demo:
          <button class="btn btn-link btn-sm p-0 mx-1" @click="fillDemo('admin')">Admin</button> ·
          <button class="btn btn-link btn-sm p-0 mx-1" @click="fillDemo('staff')">Nhân viên</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #fff1ec 0%, #f5f6f8 60%);
}
.login-card {
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(16, 24, 40, 0.08);
}
.logo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #fd5d2d;
  color: #fff;
  font-size: 1.5rem;
  display: inline-grid;
  place-items: center;
}
</style>
