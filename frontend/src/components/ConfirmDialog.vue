<script setup>
import BaseModal from './BaseModal.vue';

defineProps({
  title: { type: String, default: 'Xác nhận' },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'Đồng ý' },
  variant: { type: String, default: 'danger' },
  loading: { type: Boolean, default: false },
});
const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <BaseModal :title="title" size="sm" :closable="!loading" @close="emit('cancel')">
    <p class="mb-0">{{ message }}</p>
    <template #footer>
      <button class="btn btn-light" :disabled="loading" @click="emit('cancel')">Hủy</button>
      <button class="btn" :class="`btn-${variant}`" :disabled="loading" @click="emit('confirm')">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1" />
        {{ confirmText }}
      </button>
    </template>
  </BaseModal>
</template>
