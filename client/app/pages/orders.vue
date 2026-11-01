<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { apiErrorMessage, requestHeaders } from '~/utils/apiError';

definePageMeta({ middleware: 'account' });
useHead({ title: 'Заказы — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });

type OrderListItem = {
  id: string;
  status: string;
  statusLabel: string;
  total: number;
  quantity: number;
  createdAt: string;
  lines: { productName: string; shade: string; size: string; quantity: number; price: number }[];
};

const items = ref<OrderListItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

function formatWhen(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortId(id: string) {
  return id.slice(-8).toUpperCase();
}

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await $fetch<{ items: OrderListItem[] }>('/api/orders', {
      headers: requestHeaders(),
    });
    items.value = response.items;
  } catch (reason) {
    error.value = apiErrorMessage(reason);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner title="ЗАКАЗЫ" lead="Статус, состав и сумма каждого оформленного заказа." />

    <p v-if="error" class="mt-6 text-sm text-error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="mt-10 text-sm text-ink/60">Загружаем заказы…</p>

    <ul v-else-if="items.length" class="mt-10 divide-y divide-seam border-y border-seam">
      <li v-for="order in items" :key="order.id">
        <NuxtLink :to="`/orders/${order.id}`" class="block py-5 transition-colors hover:bg-ice/50 sm:py-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="type-label text-cobalt">ЗАКАЗ № {{ shortId(order.id) }}</p>
              <h2 class="mt-2 text-lg font-bold text-ink">{{ order.statusLabel }}</h2>
              <p class="mt-1 text-sm text-ink/60">{{ formatWhen(order.createdAt) }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-ink">{{ order.total.toLocaleString('ru-RU') }} ₽</p>
              <p class="mt-1 text-xs text-ink/55">{{ order.quantity }} шт.</p>
            </div>
          </div>
          <ul class="mt-4 space-y-1.5">
            <li
              v-for="(line, index) in order.lines.slice(0, 3)"
              :key="`${order.id}-${index}`"
              class="text-sm text-ink/70"
            >
              {{ line.productName }} · {{ line.shade }} · размер {{ line.size }} · {{ line.quantity }} шт.
            </li>
            <li v-if="order.lines.length > 3" class="text-sm text-ink/50">
              и ещё {{ order.lines.length - 3 }}
            </li>
          </ul>
        </NuxtLink>
      </li>
    </ul>

    <div v-else class="mt-10 py-12 text-center">
      <p class="text-lg font-semibold text-ink">Заказов пока нет</p>
      <p class="mt-2 text-sm text-ink/60">Когда оформите заказ, он появится здесь со статусом.</p>
      <NuxtLink to="/catalog" class="shop-button-primary mt-6">ПЕРЕЙТИ В КАТАЛОГ</NuxtLink>
    </div>
  </section>
</template>
