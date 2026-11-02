<script setup lang="ts">
import type { CatalogProduct } from '~/data/catalog';

defineProps<{
  products: CatalogProduct[];
}>();
</script>

<template>
  <div
    class="grid grid-cols-2 gap-x-3 gap-y-8 max-[359px]:grid-cols-1 sm:gap-x-4 md:grid-cols-3 xl:grid-cols-4"
    aria-label="Товары"
  >
    <CatalogProductCard v-for="product in products" :key="product.id" :product="product" />
  </div>
</template>
