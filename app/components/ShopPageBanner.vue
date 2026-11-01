<script setup lang="ts">
defineProps<{
  title: string
  lead?: string
}>()
</script>

<template>
  <div class="bg-cobalt px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
    <h1 class="type-heading text-[clamp(2.7rem,6vw,4.7rem)]">{{ title }}</h1>
    <p v-if="lead" class="mt-4 max-w-[36rem] text-base leading-6 text-white/80">{{ lead }}</p>
  </div>
</template>
