<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  variant: {
    type: String,
    default: 'neutral',
    validator: (v) => ['success', 'warning', 'danger', 'info', 'neutral'].includes(v),
  },
})

const classes = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-success-light text-success dark:bg-success/15'
    case 'warning':
      return 'bg-warning-light text-warning dark:bg-warning/15'
    case 'danger':
      return 'bg-danger-light text-danger dark:bg-danger/15'
    case 'info':
      return 'bg-secondary text-primary dark:bg-primary/15'
    default:
      return 'bg-black/5 text-text-secondary dark:bg-white/5'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
    :class="classes"
  >
    {{ label }}
  </span>
</template>
