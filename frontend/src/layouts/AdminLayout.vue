<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);

const menu = [
  { to: { name: 'products' }, match: 'product', icon: 'bi-box-seam', label: 'Sản phẩm', roles: ['admin', 'staff'] },
  { to: { name: 'orders' }, match: 'order', icon: 'bi-receipt', label: 'Đơn hàng', roles: ['admin', 'staff'] },
  // Giai đoạn 2
  { icon: 'bi-people', label: 'Khách hàng', soon: true },
  { icon: 'bi-bar-chart-line', label: 'Thống kê', soon: true },
];

const visibleMenu = computed(() => menu.filter((m) => !m.roles || auth.hasRole(...m.roles)));
const roleLabel = computed(() => (auth.isAdmin ? 'Quản trị viên' : 'Nhân viên bán hàng'));

const isActive = (item) => Boolean(item.match && route.name?.toString().startsWith(item.match));

const logout = () => {
  auth.logout();
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar bg-white border-end" :class="{ open: sidebarOpen }">
      <div class="brand d-flex align-items-center gap-2 px-4">
        <span class="brand-logo"><i class="bi bi-cart3" /></span>
        <span class="fw-bold fs-5">Sales<span class="text-primary">Manager</span></span>
      </div>
      <nav class="nav flex-column px-3 py-3 gap-1">
        <template v-for="item in visibleMenu" :key="item.label">
          <RouterLink
            v-if="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActive(item) }"
            @click="sidebarOpen = false"
          >
            <i class="bi me-2" :class="item.icon" />{{ item.label }}
          </RouterLink>
          <span v-else class="nav-link disabled d-flex justify-content-between">
            <span><i class="bi me-2" :class="item.icon" />{{ item.label }}</span>
            <span class="badge text-bg-light fw-normal">Sắp có</span>
          </span>
        </template>
      </nav>
    </aside>
    <div v-if="sidebarOpen" class="sidebar-backdrop d-lg-none" @click="sidebarOpen = false" />

    <div class="main">
      <header class="topbar bg-white border-bottom d-flex align-items-center px-3 px-lg-4">
        <button class="btn btn-light d-lg-none me-2" @click="sidebarOpen = true">
          <i class="bi bi-list" />
        </button>
        <span class="fw-semibold">{{ route.meta.title }}</span>

        <div class="dropdown ms-auto">
          <button class="btn btn-light d-flex align-items-center gap-2" data-bs-toggle="dropdown">
            <span class="avatar">{{ auth.user?.name?.charAt(0) }}</span>
            <span class="d-none d-sm-inline text-start lh-sm">
              <span class="d-block fw-semibold">{{ auth.user?.name }}</span>
              <small class="text-muted">{{ roleLabel }}</small>
            </span>
            <i class="bi bi-chevron-down small" />
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm">
            <li><span class="dropdown-item-text small text-muted">{{ auth.user?.email }}</span></li>
            <li><hr class="dropdown-divider" /></li>
            <li>
              <button class="dropdown-item text-danger" @click="logout">
                <i class="bi bi-box-arrow-right me-2" />Đăng xuất
              </button>
            </li>
          </ul>
        </div>
      </header>

      <main class="p-3 p-lg-4">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--app-sidebar-width);
  z-index: 1040;
  transition: transform 0.2s ease;
}
.brand {
  height: 64px;
}
.brand-logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #fd5d2d;
  color: #fff;
}
.nav-link {
  color: #555;
  border-radius: 0.5rem;
  padding: 0.6rem 0.85rem;
}
.nav-link:hover {
  background: #f5f6f8;
  color: #222;
}
.nav-link.active {
  background: #fff1ec;
  color: #fd5d2d;
  font-weight: 600;
}
.nav-link.disabled {
  color: #aaa;
}
.main {
  margin-left: var(--app-sidebar-width);
}
.topbar {
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 1030;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fd5d2d;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 600;
}
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1035;
}
@media (max-width: 991.98px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: none;
  }
  .main {
    margin-left: 0;
  }
}
</style>
