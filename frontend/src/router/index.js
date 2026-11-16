import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { useToastStore } from '@/stores/toast.js';

import AdminLayout from '@/layouts/AdminLayout.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guestOnly: true, title: 'Đăng nhập' },
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'products' } },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/views/products/ProductListView.vue'),
        meta: { title: 'Sản phẩm', roles: ['admin', 'staff'] },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('@/views/orders/OrderListView.vue'),
        meta: { title: 'Đơn hàng', roles: ['admin', 'staff'] },
      },
      {
        path: 'orders/create',
        name: 'order-create',
        component: () => import('@/views/orders/OrderCreateView.vue'),
        meta: { title: 'Tạo đơn hàng', roles: ['admin', 'staff'] },
      },
      {
        path: 'orders/:id',
        name: 'order-detail',
        component: () => import('@/views/orders/OrderDetailView.vue'),
        meta: { title: 'Chi tiết đơn hàng', roles: ['admin', 'staff'] },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Không tìm thấy' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let restored = false;

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Khôi phục phiên từ token đã lưu (chỉ chạy 1 lần khi tải trang)
  if (!restored) {
    restored = true;
    await auth.fetchMe();
  }

  if (to.matched.some((r) => r.meta.requiresAuth) && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isLoggedIn) return { name: 'products' };

  if (to.meta.roles && !auth.hasRole(...to.meta.roles)) {
    useToastStore().error('Bạn không có quyền truy cập trang này');
    return { name: 'products' };
  }
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | Sales Manager` : 'Sales Manager';
});

export default router;
