<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, default: 0 },
  limit: { type: Number, default: 10 },
  label: { type: String, default: 'mục' },
});
const emit = defineEmits(['update:page', 'update:limit']);

// Hiển thị: 1 … 4 5 [6] 7 8 … 20
const pages = computed(() => {
  const { page, totalPages } = props;
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const result = [1];
  const start = Math.max(2, page - 2);
  const end = Math.min(totalPages - 1, page + 2);
  if (start > 2) result.push('…');
  for (let i = start; i <= end; i += 1) result.push(i);
  if (end < totalPages - 1) result.push('…');
  result.push(totalPages);
  return result;
});

const go = (p) => {
  if (p >= 1 && p <= props.totalPages && p !== props.page) emit('update:page', p);
};
</script>

<template>
  <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
    <small class="text-muted">Tổng {{ total }} {{ label }}</small>
    <div class="d-flex align-items-center gap-2">
      <nav v-if="totalPages > 1">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: page === 1 }">
            <button class="page-link" @click="go(page - 1)"><i class="bi bi-chevron-left" /></button>
          </li>
          <li
            v-for="(p, i) in pages"
            :key="i"
            class="page-item"
            :class="{ active: p === page, disabled: p === '…' }"
          >
            <button class="page-link" @click="typeof p === 'number' && go(p)">{{ p }}</button>
          </li>
          <li class="page-item" :class="{ disabled: page === totalPages }">
            <button class="page-link" @click="go(page + 1)"><i class="bi bi-chevron-right" /></button>
          </li>
        </ul>
      </nav>
      <select
        class="form-select form-select-sm w-auto"
        :value="limit"
        @change="emit('update:limit', Number($event.target.value))"
      >
        <option v-for="n in [5, 10, 20, 50]" :key="n" :value="n">{{ n }} / trang</option>
      </select>
    </div>
  </div>
</template>
