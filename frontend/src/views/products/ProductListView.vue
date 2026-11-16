<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { productApi, categoryApi } from '@/api/productApi.js';
import { useAuthStore } from '@/stores/auth.js';
import { useToastStore } from '@/stores/toast.js';
import { formatMoney } from '@/utils/format.js';
import { debounce } from '@/utils/debounce.js';
import { onImgError } from '@/utils/image.js';
import AppPagination from '@/components/AppPagination.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EmptyState from '@/components/EmptyState.vue';
import BaseModal from '@/components/BaseModal.vue';
import ProductFormModal from './ProductFormModal.vue';

const auth = useAuthStore();
const toast = useToastStore();

const products = ref([]);
const categories = ref([]);
const loading = ref(false);
const pagination = reactive({ page: 1, limit: 10, total: 0, totalPages: 0 });
const filters = reactive({ search: '', category: '', status: '', sort: 'createdAt', order: 'desc' });

const viewMode = ref('list'); // 'list' | 'grid'
const formModal = reactive({ open: false, product: null });
const viewing = ref(null);
const deleting = ref(null);
const deleteLoading = ref(false);

const fetchProducts = async () => {
  loading.value = true;
  try {
    const params = { ...filters, page: pagination.page, limit: pagination.limit };
    Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);
    const res = await productApi.list(params);
    products.value = res.data;
    Object.assign(pagination, res.pagination);
  } catch (err) {
    toast.error(err.message);
  } finally {
    loading.value = false;
  }
};

const resetAndFetch = () => {
  pagination.page = 1;
  fetchProducts();
};
const debouncedSearch = debounce(resetAndFetch, 400);

watch(() => filters.search, debouncedSearch);
watch(() => [filters.category, filters.status], resetAndFetch);

const toggleSort = (field) => {
  if (filters.sort === field) filters.order = filters.order === 'asc' ? 'desc' : 'asc';
  else Object.assign(filters, { sort: field, order: 'asc' });
  fetchProducts();
};
const sortIcon = (field) =>
  filters.sort !== field ? 'bi-arrow-down-up text-muted' : filters.order === 'asc' ? 'bi-sort-up' : 'bi-sort-down';

const changePage = (p) => {
  pagination.page = p;
  fetchProducts();
};
const changeLimit = (l) => {
  pagination.limit = l;
  resetAndFetch();
};

const openCreate = () => Object.assign(formModal, { open: true, product: null });
const openEdit = (p) => {
  viewing.value = null;
  Object.assign(formModal, { open: true, product: p });
};
const onSaved = () => {
  formModal.open = false;
  fetchProducts();
};

const confirmDelete = async () => {
  deleteLoading.value = true;
  try {
    await productApi.remove(deleting.value._id);
    toast.success(`Đã xóa "${deleting.value.name}"`);
    deleting.value = null;
    if (products.value.length === 1 && pagination.page > 1) pagination.page -= 1;
    fetchProducts();
  } catch (err) {
    toast.error(err.message);
  } finally {
    deleteLoading.value = false;
  }
};

const resetFilters = () => Object.assign(filters, { search: '', category: '', status: '' });


onMounted(async () => {
  try {
    categories.value = (await categoryApi.list()).data;
  } catch (err) {
    toast.error(err.message);
  }
  fetchProducts();
});
</script>

<template>
  <div class="card">
    <div class="card-body">
      <!-- Header -->
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h2 class="page-title me-auto">Sản phẩm</h2>
        <div class="btn-group">
          <button
            class="btn btn-light"
            :class="{ active: viewMode === 'list' }"
            title="Dạng bảng"
            @click="viewMode = 'list'"
          >
            <i class="bi bi-list-ul" />
          </button>
          <button
            class="btn btn-light"
            :class="{ active: viewMode === 'grid' }"
            title="Dạng lưới"
            @click="viewMode = 'grid'"
          >
            <i class="bi bi-grid" />
          </button>
        </div>
        <button v-if="auth.isAdmin" class="btn btn-primary" @click="openCreate">
          <i class="bi bi-plus-square me-1" /> Thêm sản phẩm
        </button>
      </div>

      <!-- Filters -->
      <div class="row g-2 mb-3">
        <div class="col-md-5">
          <div class="input-group">
            <span class="input-group-text bg-white"><i class="bi bi-search" /></span>
            <input v-model="filters.search" class="form-control" placeholder="Tìm theo tên hoặc mô tả..." />
          </div>
        </div>
        <div class="col-6 col-md-3">
          <select v-model="filters.category" class="form-select">
            <option value="">Tất cả danh mục</option>
            <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.icon }} {{ c.name }}</option>
          </select>
        </div>
        <div class="col-6 col-md-2">
          <select v-model="filters.status" class="form-select">
            <option value="">Mọi trạng thái</option>
            <option value="available">Đang bán</option>
            <option value="unavailable">Ngừng bán</option>
          </select>
        </div>
        <div class="col-md-2 d-grid">
          <button class="btn btn-outline-secondary" @click="resetFilters">
            <i class="bi bi-arrow-counterclockwise me-1" />Đặt lại
          </button>
        </div>
      </div>

      <div class="position-relative">
        <div v-if="loading" class="loading-overlay">
          <div class="spinner-border text-primary" />
        </div>

        <!-- List view -->
        <div v-if="viewMode === 'list'" class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style="width: 60px">#</th>
                <th>Ảnh</th>
                <th class="sortable" @click="toggleSort('name')">
                  Tên <i class="bi small" :class="sortIcon('name')" />
                </th>
                <th>Mô tả</th>
                <th class="sortable text-end" @click="toggleSort('price')">
                  Giá <i class="bi small" :class="sortIcon('price')" />
                </th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th class="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in products" :key="p._id">
                <td class="text-muted">{{ (pagination.page - 1) * pagination.limit + i + 1 }}</td>
                <td><img :src="p.image" class="thumb" alt="" @error="onImgError" /></td>
                <td class="fw-medium">{{ p.name }}</td>
                <td><div class="text-truncate-1 text-muted" :title="p.description">{{ p.description }}</div></td>
                <td class="text-end">{{ formatMoney(p.price) }}</td>
                <td class="text-nowrap">{{ p.category?.icon }} {{ p.category?.name }}</td>
                <td>
                  <span
                    class="badge border"
                    :class="p.status === 'available' ? 'text-success border-success-subtle bg-success-subtle' : 'text-secondary bg-light'"
                  >
                    <i class="bi me-1" :class="p.status === 'available' ? 'bi-check-circle' : 'bi-slash-circle'" />
                    {{ p.status === 'available' ? 'Đang bán' : 'Ngừng bán' }}
                  </span>
                </td>
                <td class="text-end text-nowrap">
                  <button class="btn btn-sm btn-light" title="Xem" @click="viewing = p">
                    <i class="bi bi-eye" />
                  </button>
                  <template v-if="auth.isAdmin">
                    <button class="btn btn-sm btn-light ms-1" title="Sửa" @click="openEdit(p)">
                      <i class="bi bi-pencil" />
                    </button>
                    <button class="btn btn-sm btn-light text-danger ms-1" title="Xóa" @click="deleting = p">
                      <i class="bi bi-trash" />
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Grid view -->
        <div v-else class="row g-3">
          <div v-for="p in products" :key="p._id" class="col-sm-6 col-lg-4 col-xl-3">
            <div class="card h-100 border product-card" role="button" @click="viewing = p">
              <img :src="p.image" class="card-img-top" alt="" @error="onImgError" />
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <h6 class="mb-1">{{ p.name }}</h6>
                  <span class="fw-semibold text-primary">{{ formatMoney(p.price) }}</span>
                </div>
                <small class="text-muted">{{ p.category?.icon }} {{ p.category?.name }}</small>
                <span v-if="p.status !== 'available'" class="badge text-bg-light ms-2">Ngừng bán</span>
              </div>
            </div>
          </div>
        </div>

        <EmptyState v-if="!loading && products.length === 0" icon="bi-box" text="Không tìm thấy sản phẩm nào" />
      </div>

      <div class="mt-3">
        <AppPagination
          :page="pagination.page"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          :limit="pagination.limit"
          label="sản phẩm"
          @update:page="changePage"
          @update:limit="changeLimit"
        />
      </div>
    </div>
  </div>

  <!-- Xem chi tiết -->
  <BaseModal v-if="viewing" :title="viewing.name" @close="viewing = null">
    <img v-if="viewing.image" :src="viewing.image" class="w-100 rounded mb-3 detail-img" alt="" @error="onImgError" />
    <dl class="row mb-0">
      <dt class="col-4">Giá</dt>
      <dd class="col-8">{{ formatMoney(viewing.price) }}</dd>
      <dt class="col-4">Danh mục</dt>
      <dd class="col-8">{{ viewing.category?.icon }} {{ viewing.category?.name }}</dd>
      <dt class="col-4">Trạng thái</dt>
      <dd class="col-8">{{ viewing.status === 'available' ? 'Đang bán' : 'Ngừng bán' }}</dd>
      <dt class="col-4">Mô tả</dt>
      <dd class="col-8 mb-0">{{ viewing.description }}</dd>
    </dl>
    <template v-if="auth.isAdmin" #footer>
      <button class="btn btn-primary" @click="openEdit(viewing)"><i class="bi bi-pencil me-1" />Sửa</button>
    </template>
  </BaseModal>

  <ProductFormModal
    v-if="formModal.open"
    :product="formModal.product"
    :categories="categories"
    @close="formModal.open = false"
    @saved="onSaved"
  />

  <ConfirmDialog
    v-if="deleting"
    title="Xóa sản phẩm"
    :message="`Bạn chắc chắn muốn xóa '${deleting.name}'? Thao tác này không thể hoàn tác.`"
    confirm-text="Xóa"
    :loading="deleteLoading"
    @confirm="confirmDelete"
    @cancel="deleting = null"
  />
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
.product-card .card-img-top {
  height: 160px;
  object-fit: cover;
  background: #eee;
}
.product-card:hover {
  box-shadow: 0 6px 18px rgba(16, 24, 40, 0.1);
}
.detail-img {
  max-height: 260px;
  object-fit: cover;
}
</style>
