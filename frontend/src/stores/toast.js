import { defineStore } from 'pinia';
import { ref } from 'vue';

let nextId = 1;

export const useToastStore = defineStore('toast', () => {
  const items = ref([]);

  const remove = (id) => {
    items.value = items.value.filter((t) => t.id !== id);
  };

  const show = (message, type = 'success', timeout = 3000) => {
    const id = nextId++;
    items.value.push({ id, message, type });
    setTimeout(() => remove(id), timeout);
  };

  return {
    items,
    remove,
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'danger', 4500),
    info: (msg) => show(msg, 'primary'),
  };
});
