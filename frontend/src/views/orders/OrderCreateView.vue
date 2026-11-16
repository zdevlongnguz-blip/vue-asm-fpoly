<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { orderApi, customerApi } from '@/api/orderApi.js';
import { productApi } from '@/api/productApi.js';
import { useToastStore } from '@/stores/toast.js';
import { formatMoney } from '@/utils/format.js';
import { debounce } from '@/utils/debounce.js';
import { onImgError } from '@/utils/image.js';

const router = useRouter();
const toast = useToastStore();

// ----- Khách hàng -----
const customerMode = ref('existing'); // 'existing' | 'new'
const customerSearch = ref('');
const customerResults = ref([]);
const selectedCustomer = ref(null);
const newCustomer = reactive({ name: '', phone: '', address: '', email: '' });

const searchCustomers = debounce(async () => {
  try {
    const res = await customerApi.list({ search: customerSearch.value, limit: 8 });
    customerResults.value = res.data;
  } catch (err) {
    toast.error(err.message);
  }
}, 300);
watch(customerSearch, searchCustomers);

const selectCustomer = (c) => {
  selectedCustomer.value = c;
  customerSearch.value = '';
};

// ----- Sản phẩm -----
const productSearch = ref('');
const productResults = ref([]);
const items = ref([]); // [{ product, quantity }]

const searchProducts = debounce(async () => {
  try {
    const res = await productApi.list({ search: productSearch.value, status: 'available', limit: 8, sort: 'name', order: 'asc' });
    productResults.value = res.data;
  } catch (err) {
    toast.error(err.message);
  }
}, 300);
watch(productSearch, searchProducts);

const addItem = (product) => {
  const existing = items.value.find((i) => i.product._id === product._id);
  if (existing) existing.quantity += 1;
  else items.value.push({ product, quantity: 1 });
};
const removeItem = (index) => items.value.splice(index, 1);
const changeQty = (item, delta) => {
  item.quantity = Math.max(1, (Number(item.quantity) || 1) + delta);
};

const total = computed(() => items.value.reduce((s, i) => s + i.product.price * (Number(i.quantity) || 0), 0));
const itemCount = computed(() => items.value.reduce((s, i) => s + (Number(i.quantity) || 0), 0));

// ----- Gửi đơn -----
const note = ref('');
const submitting = ref(false);
const errors = reactive({});

const validate = () => {
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (customerMode.value === 'existing' && !selectedCustomer.value) errors.customer = 'Vui lòng chọn khách hàng';
  if (customerMode.value === 'new') {
    if (!newCustomer.name.trim()) errors.name = 'Vui lòng nhập tên khách';
    if (!/^0\d{9,10}$/.test(newCustomer.phone.trim())) errors.phone = 'SĐT phải gồm 10–11 số, bắt đầu bằng 0';
  }
  if (items.value.length === 0) errors.items = 'Vui lòng thêm ít nhất 1 sản phẩm';
  if (items.value.some((i) => !Number.isInteger(Number(i.quantity)) || Number(i.quantity) < 1)) {
    errors.items = 'Số lượng phải là số nguyên ≥ 1';
  }
  return Object.keys(errors).length === 0;
};

const submit = async () => {
  if (!validate()) {
    toast.error(Object.values(errors)[0]);
    return;
  }
  submitting.value = true;
  try {
    const payload = {
      items: items.value.map((i) => ({ product: i.product._id, quantity: Number(i.quantity) })),
      note: note.value.trim(),
      ...(customerMode.value === 'existing'
        ? { customerId: selectedCustomer.value._id }
        : { customer: { ...newCustomer, name: newCustomer.name.trim(), phone: newCustomer.phone.trim() } }),
    };
    const res = await orderApi.create(payload);
    toast.success(`Đã tạo đơn ${res.data.code}`);
    router.push({ name: 'order-detail', params: { id: res.data._id } });
  } catch (err) {
    toast.error(err.message);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  searchProducts();
  searchCustomers();
});
</script>

<template>
  <div class="d-flex align-items-center gap-2 mb-3">
    <RouterLink :to="{ name: 'orders' }" class="btn btn-light btn-sm"><i class="bi bi-arrow-left" /></RouterLink>
    <h2 class="page-title">Tạo đơn hàng</h2>
  </div>

  <div class="row g-3">
    <div class="col-lg-7">
      <!-- Khách hàng -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <h6 class="mb-0 me-auto"><i class="bi bi-person me-1" />Khách hàng</h6>
            <div class="btn-group btn-group-sm">
              <button class="btn" :class="customerMode === 'existing' ? 'btn-primary' : 'btn-light'" @click="customerMode = 'existing'">
                Khách cũ
              </button>
              <button class="btn" :class="customerMode === 'new' ? 'btn-primary' : 'btn-light'" @click="customerMode = 'new'">
                Khách mới
              </button>
            </div>
          </div>

          <template v-if="customerMode === 'existing'">
            <div v-if="selectedCustomer" class="selected-customer d-flex align-items-center p-3 rounded">
              <div class="me-auto">
                <div class="fw-semibold">{{ selectedCustomer.name }}</div>
                <small class="text-muted">{{ selectedCustomer.phone }} · {{ selectedCustomer.address || 'Chưa có địa chỉ' }}</small>
              </div>
              <button class="btn btn-sm btn-light" @click="selectedCustomer = null">Đổi</button>
            </div>
            <template v-else>
              <input
                v-model="customerSearch"
                class="form-control mb-2"
                :class="{ 'is-invalid': errors.customer }"
                placeholder="Tìm theo tên hoặc số điện thoại..."
              />
              <div class="invalid-feedback d-block mb-2" v-if="errors.customer">{{ errors.customer }}</div>
              <div class="list-group small">
                <button
                  v-for="c in customerResults"
                  :key="c._id"
                  type="button"
                  class="list-group-item list-group-item-action d-flex justify-content-between"
                  @click="selectCustomer(c)"
                >
                  <span>{{ c.name }}</span><span class="text-muted">{{ c.phone }}</span>
                </button>
                <div v-if="customerResults.length === 0" class="list-group-item text-muted">
                  Không tìm thấy. <button class="btn btn-link btn-sm p-0" @click="customerMode = 'new'">Thêm khách mới</button>
                </div>
              </div>
            </template>
          </template>

          <div v-else class="row g-2">
            <div class="col-sm-6">
              <label class="form-label small"><span class="text-danger">*</span> Tên khách</label>
              <input v-model="newCustomer.name" class="form-control" :class="{ 'is-invalid': errors.name }" />
              <div class="invalid-feedback">{{ errors.name }}</div>
            </div>
            <div class="col-sm-6">
              <label class="form-label small"><span class="text-danger">*</span> Số điện thoại</label>
              <input v-model="newCustomer.phone" class="form-control" :class="{ 'is-invalid': errors.phone }" />
              <div class="invalid-feedback">{{ errors.phone }}</div>
            </div>
            <div class="col-sm-6">
              <label class="form-label small">Email</label>
              <input v-model="newCustomer.email" type="email" class="form-control" />
            </div>
            <div class="col-sm-6">
              <label class="form-label small">Địa chỉ</label>
              <input v-model="newCustomer.address" class="form-control" />
            </div>
            <small class="text-muted">Nếu SĐT đã có trong hệ thống, đơn sẽ gắn vào khách đó.</small>
          </div>
        </div>
      </div>

      <!-- Chọn sản phẩm -->
      <div class="card">
        <div class="card-body">
          <h6 class="mb-3"><i class="bi bi-box-seam me-1" />Thêm sản phẩm</h6>
          <input v-model="productSearch" class="form-control mb-2" placeholder="Tìm sản phẩm đang bán..." />
          <div class="list-group">
            <button
              v-for="p in productResults"
              :key="p._id"
              type="button"
              class="list-group-item list-group-item-action d-flex align-items-center gap-2"
              @click="addItem(p)"
            >
              <img :src="p.image" class="thumb" alt="" @error="onImgError" />
              <span class="me-auto">
                {{ p.name }}
                <small class="d-block text-muted">{{ p.category?.icon }} {{ p.category?.name }}</small>
              </span>
              <span class="fw-medium">{{ formatMoney(p.price) }}</span>
              <i class="bi bi-plus-circle text-primary fs-5" />
            </button>
            <div v-if="productResults.length === 0" class="list-group-item text-muted small">Không tìm thấy sản phẩm</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Giỏ / tóm tắt -->
    <div class="col-lg-5">
      <div class="card summary">
        <div class="card-body">
          <h6 class="mb-3"><i class="bi bi-cart me-1" />Đơn hàng ({{ itemCount }} món)</h6>

          <div v-if="items.length === 0" class="text-muted text-center py-4 small" :class="{ 'text-danger': errors.items }">
            <i class="bi bi-cart-x fs-3 d-block mb-1" />Chưa có sản phẩm nào
          </div>

          <ul v-else class="list-unstyled mb-3">
            <li v-for="(item, idx) in items" :key="item.product._id" class="d-flex align-items-center gap-2 py-2 border-bottom">
              <div class="me-auto">
                <div class="fw-medium">{{ item.product.name }}</div>
                <small class="text-muted">{{ formatMoney(item.product.price) }}</small>
              </div>
              <div class="input-group input-group-sm qty">
                <button class="btn btn-outline-secondary" @click="changeQty(item, -1)"><i class="bi bi-dash" /></button>
                <input v-model.number="item.quantity" type="number" min="1" class="form-control text-center" />
                <button class="btn btn-outline-secondary" @click="changeQty(item, 1)"><i class="bi bi-plus" /></button>
              </div>
              <span class="fw-semibold text-end" style="width: 72px">{{ formatMoney(item.product.price * (item.quantity || 0)) }}</span>
              <button class="btn btn-sm btn-link text-danger p-0" @click="removeItem(idx)"><i class="bi bi-x-lg" /></button>
            </li>
          </ul>

          <label class="form-label small">Ghi chú</label>
          <textarea v-model="note" rows="2" class="form-control mb-3" placeholder="Ghi chú cho đơn (tùy chọn)" />

          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="text-muted">Tổng cộng</span>
            <span class="fs-4 fw-bold text-primary">{{ formatMoney(total) }}</span>
          </div>
          <button class="btn btn-primary w-100 py-2" :disabled="submitting" @click="submit">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-1" />
            Tạo đơn hàng
          </button>
          <small class="text-muted d-block mt-2 text-center">Giá cuối cùng được tính lại ở máy chủ.</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selected-customer {
  background: #fff1ec;
}
.qty {
  width: 110px;
}
.qty input::-webkit-inner-spin-button {
  display: none;
}
.summary {
  position: sticky;
  top: 80px;
}
</style>
