<script setup>
defineProps({
  icon: { type: String, default: 'bi-inbox' },
  text: { type: String, default: 'Không có dữ liệu' },
});
</script>

<template>
  <div class="text-center text-muted py-5">
    <i class="bi fs-1 d-block mb-2" :class="icon" />
    {{ text }}
  </div>
</template>
