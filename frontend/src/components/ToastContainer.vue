<script setup>
import { useToastStore } from '@/stores/toast.js';

const toast = useToastStore();
</script>

<template>
  <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 2000">
    <TransitionGroup name="toast">
      <div
        v-for="t in toast.items"
        :key="t.id"
        class="toast show align-items-center border-0 mb-2"
        :class="`text-bg-${t.type}`"
        role="alert"
      >
        <div class="d-flex">
          <div class="toast-body">{{ t.message }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="toast.remove(t.id)" />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
