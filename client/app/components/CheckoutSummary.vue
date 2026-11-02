<script setup lang="ts">
import type { CheckoutSummaryLine } from '~/types/checkout';

defineProps<{
  lines: CheckoutSummaryLine[];
  total: number;
  quantity: number;
}>();
</script>

<template>
  <aside
    class="w-full border border-seam bg-white p-5 sm:p-6 lg:sticky lg:top-28"
    :aria-label="`Состав заказа, ${quantity} шт.`"
  >
    <h2 class="text-lg font-semibold text-ink">Состав заказа</h2>
    <ul class="mt-4 divide-y divide-seam border-y border-seam">
      <li v-for="line in lines" :key="line.key" class="py-4">
        <p class="text-sm font-semibold text-ink">{{ line.name }}</p>
        <p class="mt-1 text-xs text-ink/60">
          {{ line.shade }} · размер {{ line.size }} · {{ line.quantity }} шт.
        </p>
        <p class="mt-2 text-sm font-bold text-ink">{{ line.lineTotal.toLocaleString('ru-RU') }} ₽</p>
      </li>
      <li v-if="!lines.length" class="py-5 text-sm text-ink/60">В корзине нет товаров для оформления.</li>
    </ul>
    <div class="mt-4 flex justify-between gap-4 text-sm text-ink/70">
      <span>Доставка</span>
      <span>Бесплатно</span>
    </div>
    <div
      class="mt-4 flex items-baseline justify-between gap-4 border-t border-seam pt-4 text-lg font-bold text-ink"
    >
      <span>Итого</span>
      <span>{{ total.toLocaleString('ru-RU') }} ₽</span>
    </div>
  </aside>
</template>
