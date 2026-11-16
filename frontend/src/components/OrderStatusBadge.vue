<script setup>
import { computed } from 'vue';
import { ORDER_STATUS } from '@/utils/format.js';

const props = defineProps({ status: { type: String, required: true } });
const info = computed(() => ORDER_STATUS[props.status] || { label: props.status, color: 'secondary', icon: '' });
</script>

<template>
  <span class="badge rounded-pill" :class="`text-bg-${info.color}`">
    <i class="bi me-1" :class="info.icon" />{{ info.label }}
  </span>
</template>
