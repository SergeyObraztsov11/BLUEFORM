<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { OrderListItem } from '~/types/order';
import { apiErrorMessage, requestHeaders } from '~/utils/apiError';

definePageMeta({ middleware: 'account' });
useHead({ title: 'Заказы — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });

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

async function loadOrders() {
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
}

onMounted(() => {
  void loadOrders();
});
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-6 md:pt-8">
    <ShopPageHeader title="Заказы" />

    <div v-if="loading" role="status" aria-live="polite">
      <p class="text-sm text-ink/60">Загружаем заказы…</p>
    </div>

    <div v-else-if="error" class="max-w-[640px]">
      <p class="text-sm text-error" role="alert">{{ error }}</p>
      <button type="button" class="shop-button-primary mt-6" @click="loadOrders">ПОВТОРИТЬ</button>
    </div>

    <ul v-else-if="items.length" class="grid gap-4" aria-label="Список заказов">
      <li v-for="order in items" :key="order.id">
        <NuxtLink
          :to="`/orders/${order.id}`"
          class="block border border-seam bg-white p-5 transition-colors hover:border-cobalt focus-visible:border-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt sm:p-6"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 max-w-full sm:max-w-[min(100%,20rem)]">
              <h2 class="text-lg font-semibold text-ink">Заказ № {{ shortId(order.id) }}</h2>
              <p class="mt-1 text-sm text-ink/55">{{ formatWhen(order.createdAt) }}</p>
              <span class="mt-3 inline-flex items-center bg-ice px-2.5 py-1 text-xs font-semibold text-ink">{{
                order.statusLabel
              }}</span>
            </div>
            <p class="text-xl font-bold text-ink">{{ order.total.toLocaleString('ru-RU') }} ₽</p>
          </div>

          <ul class="mt-4 space-y-1.5">
            <li
              v-for="(line, index) in order.lines.slice(0, 3)"
              :key="`${order.id}-${index}`"
              class="text-sm text-ink"
            >
              {{ line.productName }}
              <span class="text-ink/55">
                · {{ line.shade }} · размер {{ line.size }} · {{ line.quantity }} шт.
              </span>
            </li>
            <li v-if="order.lines.length > 3" class="text-sm text-ink/50">
              и ещё {{ order.lines.length - 3 }}
            </li>
          </ul>

          <p class="mt-4 text-sm font-semibold text-cobalt">Открыть заказ →</p>
        </NuxtLink>
      </li>
    </ul>

    <div v-else class="py-10 text-center sm:py-12">
      <p class="text-base font-semibold text-ink">Заказов пока нет</p>
      <NuxtLink to="/catalog" class="shop-button-primary mt-5">В каталог</NuxtLink>
    </div>
  </section>
</template>
