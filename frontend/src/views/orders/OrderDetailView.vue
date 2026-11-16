<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderApi } from '@/api/orderApi.js';
import { useAuthStore } from '@/stores/auth.js';
import { useToastStore } from '@/stores/toast.js';
import { formatMoney, formatDate, ORDER_STATUS, STATUS_FLOW } from '@/utils/format.js';
import OrderStatusBadge from '@/components/OrderStatusBadge.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();

const order = ref(null);
const loading = ref(true);
const pendingStatus = ref(null);
const updating = ref(false);
const confirmDelete = ref(false);

const steps = ['pending', 'confirmed', 'shipping', 'completed'];
const currentStep = computed(() => steps.indexOf(order.value?.status));

const nextStatuses = computed(() => {
  if (!order.value) return [];
  return STATUS_FLOW[order.value.status].filter(
    // Nhân viên không được hủy đơn đang giao (khớp với backend)
    (s) => !(s === 'cancelled' && order.value.status === 'shipping' && !auth.isAdmin)
  );
});

const fetchOrder = async () => {
  loading.value = true;
  try {
    order.value = (await orderApi.get(route.params.id)).data;
  } catch (err) {
    toast.error(err.message);
    router.replace({ name: 'orders' });
  } finally {
    loading.value = false;
  }
};

const applyStatus = async () => {
  updating.value = true;
  try {
    order.value = (await orderApi.updateStatus(order.value._id, pendingStatus.value)).data;
    toast.success(`Đã chuyển sang "${ORDER_STATUS[pendingStatus.value].label}"`);
    pendingStatus.value = null;
  } catch (err) {
    toast.error(err.message);
  } finally {
    updating.value = false;
  }
};

const removeOrder = async () => {
  updating.value = true;
  try {
    await orderApi.remove(order.value._id);
    toast.success('Đã xóa đơn hàng');
    router.push({ name: 'orders' });
  } catch (err) {
    toast.error(err.message);
    updating.value = false;
  }
};

onMounted(fetchOrder);
</script>

<template>
  <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary" /></div>

  <template v-else-if="order">
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <RouterLink :to="{ name: 'orders' }" class="btn btn-light btn-sm"><i class="bi bi-arrow-left" /></RouterLink>
      <h2 class="page-title">Đơn {{ order.code }}</h2>
      <OrderStatusBadge :status="order.status" />
      <div class="ms-auto d-flex gap-2">
        <button
          v-for="s in nextStatuses"
          :key="s"
          class="btn btn-sm"
          :class="s === 'cancelled' ? 'btn-outline-danger' : 'btn-primary'"
          @click="pendingStatus = s"
        >
          <i class="bi me-1" :class="ORDER_STATUS[s].icon" />
          {{ s === 'cancelled' ? 'Hủy đơn' : ORDER_STATUS[s].label }}
        </button>
        <button v-if="auth.isAdmin && order.status === 'cancelled'" class="btn btn-sm btn-danger" @click="confirmDelete = true">
          <i class="bi bi-trash me-1" />Xóa đơn
        </button>
      </div>
    </div>

    <!-- Tiến trình -->
    <div class="card mb-3">
      <div class="card-body">
        <div v-if="order.status === 'cancelled'" class="alert alert-secondary mb-0">
          <i class="bi bi-x-circle me-1" /> Đơn hàng đã bị hủy.
        </div>
        <div v-else class="stepper d-flex">
          <div v-for="(s, i) in steps" :key="s" class="step flex-fill text-center" :class="{ done: i <= currentStep }">
            <div class="dot mx-auto mb-1"><i class="bi" :class="ORDER_STATUS[s].icon" /></div>
            <small>{{ ORDER_STATUS[s].label }}</small>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-body">
            <h6 class="mb-3">Sản phẩm</h6>
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th class="text-end">Đơn giá</th>
                    <th class="text-center">SL</th>
                    <th class="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in order.items" :key="item.product">
                    <td>{{ item.name }}</td>
                    <td class="text-end">{{ formatMoney(item.price) }}</td>
                    <td class="text-center">{{ item.quantity }}</td>
                    <td class="text-end fw-medium">{{ formatMoney(item.price * item.quantity) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="text-end fw-semibold border-0">Tổng cộng</td>
                    <td class="text-end fs-5 fw-bold text-primary border-0">{{ formatMoney(order.total) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div v-if="order.note" class="mt-3 p-2 bg-light rounded small"><i class="bi bi-chat-left-text me-1" />{{ order.note }}</div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="mb-3"><i class="bi bi-person me-1" />Khách hàng</h6>
            <div class="fw-semibold">{{ order.customer?.name }}</div>
            <div class="small text-muted"><i class="bi bi-telephone me-1" />{{ order.customer?.phone }}</div>
            <div v-if="order.customer?.email" class="small text-muted"><i class="bi bi-envelope me-1" />{{ order.customer.email }}</div>
            <div v-if="order.customer?.address" class="small text-muted"><i class="bi bi-geo-alt me-1" />{{ order.customer.address }}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h6 class="mb-3"><i class="bi bi-clock-history me-1" />Lịch sử</h6>
            <ul class="timeline list-unstyled mb-0 small">
              <li v-for="(h, i) in [...order.statusHistory].reverse()" :key="i" class="mb-2">
                <OrderStatusBadge :status="h.status" />
                <div class="text-muted mt-1">{{ formatDate(h.changedAt) }} · {{ h.changedBy?.name || '—' }}</div>
              </li>
            </ul>
            <hr />
            <div class="small text-muted">Tạo bởi {{ order.createdBy?.name }} lúc {{ formatDate(order.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <ConfirmDialog
    v-if="pendingStatus"
    :title="pendingStatus === 'cancelled' ? 'Hủy đơn hàng' : 'Cập nhật trạng thái'"
    :message="pendingStatus === 'cancelled'
      ? `Bạn chắc chắn muốn hủy đơn ${order.code}?`
      : `Chuyển đơn ${order.code} sang '${ORDER_STATUS[pendingStatus].label}'?`"
    :variant="pendingStatus === 'cancelled' ? 'danger' : 'primary'"
    :confirm-text="pendingStatus === 'cancelled' ? 'Hủy đơn' : 'Xác nhận'"
    :loading="updating"
    @confirm="applyStatus"
    @cancel="pendingStatus = null"
  />
  <ConfirmDialog
    v-if="confirmDelete"
    title="Xóa đơn hàng"
    :message="`Xóa vĩnh viễn đơn ${order.code}?`"
    confirm-text="Xóa"
    :loading="updating"
    @confirm="removeOrder"
    @cancel="confirmDelete = false"
  />
</template>

<style scoped>
.stepper .step {
  position: relative;
  color: #aaa;
}
.stepper .step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 18px;
  left: calc(50% + 22px);
  right: calc(-50% + 22px);
  height: 2px;
  background: #e5e5e5;
}
.stepper .step.done {
  color: #333;
}
.stepper .step.done:not(:last-child)::after {
  background: #fd5d2d;
}
.dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #f0f0f0;
}
.step.done .dot {
  background: #fd5d2d;
  color: #fff;
}
</style>
