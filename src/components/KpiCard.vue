<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: Object, required: true },
  accent: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'success', 'warning', 'danger'].includes(v),
  },
  loading: { type: Boolean, default: false },
})

const accentClasses = {
  primary: 'bg-secondary text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
}
</script>

<template>
  <div
    class="rounded-2xl bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border"
  >
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm font-medium text-text-secondary">{{ label }}</p>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-text">
          <span v-if="loading" class="inline-block h-8 w-16 animate-pulse rounded-md bg-black/5 dark:bg-white/10" />
          <span v-else>{{ value }}</span>
        </p>
      </div>
      <div class="rounded-xl p-2.5" :class="accentClasses[accent]">
        <component :is="icon" class="h-5 w-5" stroke-width="2" />
      </div>
    </div>
  </div>
</template>
