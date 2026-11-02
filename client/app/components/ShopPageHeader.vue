<script setup lang="ts">
defineProps<{
  title: string;
  /** Quiet secondary label beside the title (e.g. cart item count). */
  meta?: string;
  /** Useful error or exceptional status copy only — not page introductions. */
  description?: string;
}>();
</script>

<template>
  <header
    class="shop-page-header"
    :class="$slots.actions ? 'flex flex-wrap items-start justify-between gap-x-6 gap-y-2' : undefined"
  >
    <div class="min-w-0">
      <h1 class="shop-page-header-title">
        {{ title
        }}<span
          v-if="meta"
          class="ml-3 align-middle text-base font-semibold tracking-normal text-ink/55 md:text-lg"
          >{{ meta }}</span
        >
      </h1>
      <p v-if="description" class="shop-page-header-description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="min-w-0 max-w-full shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>
