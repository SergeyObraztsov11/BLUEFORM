<script setup lang="ts">
defineProps<{
  title: string
  lead: string
}>()
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner :title="title" :lead="lead" />

    <div class="mt-10 min-h-48 border-t border-seam" />
  </section>
</template>
