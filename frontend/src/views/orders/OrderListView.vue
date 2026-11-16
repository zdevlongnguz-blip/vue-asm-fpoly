<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { orderApi } from '@/api/orderApi.js';
import { useToastStore } from '@/stores/toast.js';
import { formatMoney, formatDate, ORDER_STATUS } from '@/utils/format.js';
import { debounce } from '@/utils/debounce.js';
import AppPagination from '@/components/AppPagination.vue';
import OrderStatusBadge from '@/components/OrderStatusBadge.vue';
import EmptyState from '@/components/EmptyState.vue';

const router = useRouter();
const toast = useToastStore();

const orders = ref([]);
const loading = ref(false);
const pagination = reactive({ page: 1, limit: 10, total: 0, totalPages: 0 });
const filters = reactive({ search: '', status: '', from: '', to: '' });

const statusTabs = [{ value: '', label: 'Tất cả' }, ...Object.entries(ORDER_STATUS).map(([value, s]) => ({ value, label: s.label }))];

const fetchOrders = async () => {
  loading.value = true;
  try {
    const params = { ...filters, page: pagination.page, limit: pagination.limit };
    Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);
    const res = await orderApi.list(params);
    orders.value = res.data;
    Object.assign(pagination, res.pagination);
  } catch (err) {
    toast.error(err.message);
  } finally {
    loading.value = false;
  }
};

const resetAndFetch = () => {
  pagination.page = 1;
  fetchOrders();
};
watch(() => filters.search, debounce(resetAndFetch, 400));
watch(() => [filters.status, filters.from, filters.to], resetAndFetch);

const itemSummary = (items) =>
  items.map((i) => `${i.name} x${i.quantity}`).join(', ');

const open = (o) => router.push({ name: 'order-detail', params: { id: o._id } });

onMounted(fetchOrders);
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h2 class="page-title me-auto">Đơn hàng</h2>
        <RouterLink :to="{ name: 'order-create' }" class="btn btn-primary">
          <i class="bi bi-plus-square me-1" /> Tạo đơn hàng
        </RouterLink>
      </div>

      <ul class="nav nav-underline mb-3 flex-nowrap overflow-auto">
        <li v-for="t in statusTabs" :key="t.value" class="nav-item">
          <button class="nav-link text-nowrap" :class="{ active: filters.status === t.value }" @click="filters.status = t.value">
            {{ t.label }}
          </button>
        </li>
      </ul>

      <div class="row g-2 mb-3">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text bg-white"><i class="bi bi-search" /></span>
            <input v-model="filters.search" class="form-control" placeholder="Mã đơn, tên hoặc SĐT khách..." />
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="input-group">
            <span class="input-group-text bg-white small">Từ</span>
            <input v-model="filters.from" type="date" class="form-control" />
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="input-group">
            <span class="input-group-text bg-white small">Đến</span>
            <input v-model="filters.to" type="date" class="form-control" :min="filters.from" />
          </div>
        </div>
      </div>

      <div class="table-responsive position-relative">
        <div v-if="loading" class="loading-overlay"><div class="spinner-border text-primary" /></div>
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Sản phẩm</th>
              <th class="text-end">Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Người tạo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o._id" role="button" @click="open(o)">
              <td class="fw-semibold">{{ o.code }}</td>
              <td>
                <div>{{ o.customer?.name }}</div>
                <small class="text-muted">{{ o.customer?.phone }}</small>
              </td>
              <td><div class="text-truncate-1 small" :title="itemSummary(o.items)">{{ itemSummary(o.items) }}</div></td>
              <td class="text-end fw-medium">{{ formatMoney(o.total) }}</td>
              <td><OrderStatusBadge :status="o.status" /></td>
              <td class="text-nowrap small">{{ formatDate(o.createdAt) }}</td>
              <td class="small">{{ o.createdBy?.name }}</td>
              <td class="text-end"><i class="bi bi-chevron-right text-muted" /></td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="!loading && orders.length === 0" icon="bi-receipt" text="Chưa có đơn hàng nào" />
      </div>

      <div class="mt-3">
        <AppPagination
          :page="pagination.page"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          :limit="pagination.limit"
          label="đơn hàng"
          @update:page="(p) => { pagination.page = p; fetchOrders(); }"
          @update:limit="(l) => { pagination.limit = l; resetAndFetch(); }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  display: grid;
  place-items: center;
  z-index: 5;
  min-height: 120px;
}
.nav-underline .nav-link {
  color: #666;
}
.nav-underline .nav-link.active {
  color: #fd5d2d;
  border-bottom-color: #fd5d2d;
}
</style>
