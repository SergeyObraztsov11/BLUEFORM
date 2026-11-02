<script setup lang="ts">
import { useCartStore } from '~/stores/cart';

const cart = useCartStore();
</script>

<template>
  <aside
    class="w-full border border-seam bg-white p-5 sm:p-6 lg:sticky lg:top-28 lg:w-[300px] xl:w-[320px]"
    aria-label="Сводка корзины"
  >
    <div class="flex items-baseline justify-between gap-4 text-lg font-bold text-ink">
      <span>Итого</span>
      <span>{{ cart.total.toLocaleString('ru-RU') }} ₽</span>
    </div>
    <p class="mt-3 text-sm leading-5 text-ink/65">Доставка бесплатно</p>
    <p v-if="cart.hasStockIssues" class="mt-4 text-sm text-error" role="alert">
      Проверьте наличие и количество товаров в корзине перед оформлением.
    </p>
    <NuxtLink
      v-if="cart.totalQuantity > 0 && !cart.hasStockIssues"
      to="/checkout"
      class="shop-button-primary mt-6 w-full"
      >Оформить заказ</NuxtLink
    >
    <button
      v-else
      type="button"
      disabled
      class="shop-button-primary mt-6 w-full"
      :aria-label="
        cart.hasStockIssues
          ? 'Оформление недоступно: проверьте наличие и количество'
          : 'Оформление недоступно: корзина пуста'
      "
    >
      Оформить заказ
    </button>
    <NuxtLink
      to="/catalog"
      class="mt-4 block text-center text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
      >Продолжить покупки</NuxtLink
    >
  </aside>
</template>
