<script setup lang="ts">
defineProps<{
  title: string;
  lead?: string;
}>();
</script>

<template>
  <div class="shop-page-banner bg-cobalt px-4 py-6 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
    <h1 class="shop-page-banner-title type-heading">{{ title }}</h1>
    <p v-if="lead" class="mt-3 max-w-[36rem] text-sm leading-6 text-white/80 sm:mt-4 sm:text-base">
      {{ lead }}
    </p>
  </div>
</template>
