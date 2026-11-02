<script setup lang="ts">
import { computed } from 'vue';
import type { CatalogPage, CatalogProduct } from '~/data/catalog';
import { apiErrorMessage, requestHeaders } from '~/utils/apiError';

const route = useRoute();
const id = computed(() => String(route.params.id));

const {
  data: product,
  status,
  error,
  refresh,
} = await useAsyncData(
  () => `product-${id.value}`,
  async () => {
    try {
      return await $fetch<CatalogProduct>(`/api/catalog/products/${id.value}`, { headers: requestHeaders() });
    } catch (reason) {
      const statusCode =
        reason && typeof reason === 'object' && 'statusCode' in reason ? Number(reason.statusCode) : 0;
      if (statusCode === 404) return null;
      throw reason;
    }
  },
  { watch: [id] },
);

const { data: relatedProducts } = await useAsyncData(
  () => `related-${product.value?.categorySlug ?? 'none'}-${id.value}`,
  async () => {
    if (!product.value) return [];
    const page = await $fetch<CatalogPage>('/api/catalog/products', {
      query: { category: product.value.categorySlug },
      headers: requestHeaders(),
    });
    return page.items.filter((item) => item.id !== product.value?.id).slice(0, 4);
  },
  { watch: [() => product.value?.id], default: () => [] },
);

const loadErrorMessage = computed(() =>
  error.value ? apiErrorMessage(error.value) : 'Не удалось загрузить товар. Попробуйте ещё раз.',
);

useHead(() => ({
  title:
    status.value === 'error'
      ? 'Ошибка загрузки | BLUEFORM'
      : product.value
        ? `${product.value.name} — ${product.value.shade} | BLUEFORM`
        : 'Товар не найден | BLUEFORM',
}));
</script>

<template>
  <div class="min-h-[70vh] pt-5 md:pt-6">
    <p v-if="status === 'pending'" class="pb-24 pt-14 text-sm text-ink/65">Загружаем товар…</p>
    <template v-else-if="product">
      <ProductDetails :product="product" class="pb-16 md:pb-20" />
      <ProductRelated :products="relatedProducts ?? []" />
    </template>
    <section v-else-if="status === 'error'" class="pb-24">
      <ShopPageBanner title="НЕ УДАЛОСЬ ЗАГРУЗИТЬ" :lead="loadErrorMessage" />
      <button type="button" class="shop-button-primary mt-8" @click="refresh()">ПОВТОРИТЬ</button>
    </section>
    <section v-else class="pb-24">
      <ShopPageBanner
        title="ТОВАР НЕ НАЙДЕН"
        lead="Возможно, ссылка устарела. Откройте каталог и выберите другую вещь."
      />
      <NuxtLink to="/catalog" class="shop-button-primary mt-8">ПЕРЕЙТИ В КАТАЛОГ</NuxtLink>
    </section>
  </div>
</template>
