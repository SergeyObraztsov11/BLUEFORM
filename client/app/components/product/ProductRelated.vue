<script setup lang="ts">
import type { CatalogProduct } from '~/data/catalog'

defineProps<{ products: CatalogProduct[] }>()
</script>

<template>
  <section v-if="products.length" class="border-t border-seam pb-20 pt-10 md:pt-14">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="type-label text-cobalt">ВЫБЕРИ СВОЙ ОТТЕНОК</p>
        <h2 class="mt-2 text-2xl font-bold uppercase text-ink md:text-3xl">Другие цвета</h2>
      </div>
      <NuxtLink to="/catalog" class="text-sm font-semibold text-cobalt hover:text-ink">Все товары →</NuxtLink>
    </div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-8 max-[359px]:grid-cols-1 md:grid-cols-4 md:gap-x-5">
      <CatalogProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </section>
</template>
