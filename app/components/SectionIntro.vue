<script setup lang="ts">
defineProps<{
  title: string
  description: string
  titleId: string
}>()
</script>

<template>
  <div class="rhythm-one section-intro grid grid-cols-[minmax(0,1fr)_minmax(250px,320px)] content-center items-end gap-x-12 max-md:grid-cols-1 max-md:gap-y-6">
    <div>
      <h2 :id="titleId" class="type-heading whitespace-pre-line text-[clamp(2.7rem,5vw,4.7rem)] text-ink max-md:text-[clamp(2.1rem,8.6vw,3rem)]">{{ title }}</h2>
    </div>
    <p class="type-body mb-1 max-w-[320px]">{{ description }}</p>
  </div>
</template>

<style scoped>
@media (max-width: 767px) {
  .section-intro { min-height: 0; padding: 32px 0; }
}
</style>
