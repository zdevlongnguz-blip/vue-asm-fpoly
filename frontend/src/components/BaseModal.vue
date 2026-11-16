<script setup>
import { onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  title: { type: String, default: '' },
  size: { type: String, default: '' }, // '', 'sm', 'lg', 'xl'
  closable: { type: Boolean, default: true },
});
const emit = defineEmits(['close']);

const close = () => props.closable && emit('close');
const onKey = (e) => e.key === 'Escape' && close();

onMounted(() => {
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', onKey);
});
</script>

<template>
  <Teleport to="body">
    <div class="modal d-block" tabindex="-1" @mousedown.self="close">
      <div class="modal-dialog modal-dialog-scrollable" :class="size && `modal-${size}`">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ title }}</h5>
            <button type="button" class="btn-close" :disabled="!closable" @click="close" />
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer bg-light">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop show" />
  </Teleport>
</template>
