<script setup>
import { reactive, ref, computed } from 'vue';
import BaseModal from '@/components/BaseModal.vue';
import { productApi } from '@/api/productApi.js';
import { useToastStore } from '@/stores/toast.js';
import { onImgError } from '@/utils/image.js';

const props = defineProps({
  product: { type: Object, default: null }, // null = thêm mới
  categories: { type: Array, required: true },
});
const emit = defineEmits(['close', 'saved']);
const toast = useToastStore();

const isEdit = computed(() => Boolean(props.product));

const form = reactive({
  name: props.product?.name ?? '',
  description: props.product?.description ?? '',
  price: props.product?.price ?? '',
  category: props.product?.category?._id ?? '',
  image: props.product?.image ?? '',
  status: props.product?.status ?? 'available',
});
const errors = reactive({});
const saving = ref(false);

const validate = () => {
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (!form.name.trim()) errors.name = 'Vui lòng nhập tên sản phẩm';
  else if (form.name.trim().length < 2) errors.name = 'Tên tối thiểu 2 ký tự';
  if (!form.description.trim()) errors.description = 'Vui lòng nhập mô tả';
  if (form.price === '' || form.price === null) errors.price = 'Vui lòng nhập giá';
  else if (Number(form.price) < 0) errors.price = 'Giá không được âm';
  if (!form.category) errors.category = 'Vui lòng chọn danh mục';
  if (form.image && !/^https?:\/\//.test(form.image)) errors.image = 'Link ảnh phải bắt đầu bằng http(s)://';
  return Object.keys(errors).length === 0;
};

const submit = async () => {
  if (!validate()) return;
  saving.value = true;
  const payload = { ...form, name: form.name.trim(), description: form.description.trim(), price: Number(form.price) };
  try {
    const res = isEdit.value
      ? await productApi.update(props.product._id, payload)
      : await productApi.create(payload);
    toast.success(isEdit.value ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
    emit('saved', res.data);
  } catch (err) {
    if (err.errors) Object.assign(errors, err.errors);
    toast.error(err.message);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <BaseModal :title="isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'" :closable="!saving" @close="emit('close')">
    <form id="product-form" novalidate @submit.prevent="submit">
      <div class="mb-3">
        <label class="form-label"><span class="text-danger">*</span> Tên sản phẩm</label>
        <input v-model="form.name" class="form-control" :class="{ 'is-invalid': errors.name }" />
        <div class="invalid-feedback">{{ errors.name }}</div>
      </div>

      <div class="mb-3">
        <label class="form-label"><span class="text-danger">*</span> Mô tả</label>
        <textarea
          v-model="form.description"
          rows="4"
          class="form-control"
          :class="{ 'is-invalid': errors.description }"
        />
        <div class="invalid-feedback">{{ errors.description }}</div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-sm-5">
          <label class="form-label"><span class="text-danger">*</span> Giá</label>
          <div class="input-group has-validation">
            <span class="input-group-text">$</span>
            <input
              v-model="form.price"
              type="number"
              min="0"
              step="0.01"
              class="form-control"
              :class="{ 'is-invalid': errors.price }"
            />
            <div class="invalid-feedback">{{ errors.price }}</div>
          </div>
        </div>
        <div class="col-sm-7">
          <label class="form-label"><span class="text-danger">*</span> Danh mục</label>
          <select v-model="form.category" class="form-select" :class="{ 'is-invalid': errors.category }">
            <option value="" disabled>-- Chọn danh mục --</option>
            <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.icon }} {{ c.name }}</option>
          </select>
          <div class="invalid-feedback">{{ errors.category }}</div>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Link ảnh</label>
        <div class="d-flex gap-2 align-items-start">
          <div class="flex-grow-1">
            <input
              v-model="form.image"
              class="form-control"
              placeholder="https://..."
              :class="{ 'is-invalid': errors.image }"
            />
            <div class="invalid-feedback">{{ errors.image }}</div>
          </div>
          <img v-if="form.image && !errors.image" :src="form.image" class="thumb" alt="" @error="onImgError" />
        </div>
      </div>

      <div>
        <label class="form-label d-block">Trạng thái</label>
        <div class="btn-group w-100" role="group">
          <input id="st-av" v-model="form.status" type="radio" class="btn-check" value="available" />
          <label class="btn btn-outline-success" for="st-av">Đang bán</label>
          <input id="st-un" v-model="form.status" type="radio" class="btn-check" value="unavailable" />
          <label class="btn btn-outline-secondary" for="st-un">Ngừng bán</label>
        </div>
      </div>
    </form>

    <template #footer>
      <button class="btn btn-light" :disabled="saving" @click="emit('close')">Hủy</button>
      <button type="submit" form="product-form" class="btn btn-primary" :disabled="saving">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1" />
        Lưu
      </button>
    </template>
  </BaseModal>
</template>
