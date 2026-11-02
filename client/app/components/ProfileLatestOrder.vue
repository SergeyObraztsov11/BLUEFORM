<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { OrderListItem } from '~/types/order';
import { apiErrorMessage, requestHeaders } from '~/utils/apiError';

const order = ref<OrderListItem | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const shortId = computed(() => (order.value ? order.value.id.slice(-8).toUpperCase() : ''));

function formatWhen(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

async function loadLatestOrder() {
  loading.value = true;
  error.value = null;
  try {
    const response = await $fetch<{ items: OrderListItem[] }>('/api/orders', {
      headers: requestHeaders(),
    });
    // Server returns createdAt desc; first item is the latest.
    order.value = response.items[0] ?? null;
  } catch (reason) {
    order.value = null;
    error.value = apiErrorMessage(reason);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadLatestOrder();
});
</script>

<template>
  <div>
    <h2 class="text-[20px] font-semibold text-ink">Последний заказ</h2>

    <div v-if="loading" class="mt-5" role="status" aria-live="polite">
      <p class="text-sm text-ink/60">Загружаем заказ…</p>
    </div>

    <div v-else-if="error" class="mt-5">
      <p class="text-sm text-error" role="alert">{{ error }}</p>
      <button
        type="button"
        class="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        @click="loadLatestOrder"
      >
        Повторить
      </button>
    </div>

    <div v-else-if="!order" class="mt-5">
      <p class="text-sm text-ink/70">Заказов пока нет</p>
      <NuxtLink
        to="/catalog"
        class="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
      >
        Перейти в каталог
      </NuxtLink>
    </div>

    <div v-else class="mt-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-ink">№ {{ shortId }}</p>
          <p class="mt-1 text-sm text-ink/55">{{ formatWhen(order.createdAt) }}</p>
        </div>
        <span class="inline-flex items-center bg-ice px-2.5 py-1 text-xs font-semibold text-ink">{{
          order.statusLabel
        }}</span>
      </div>

      <ul class="mt-4 space-y-1.5">
        <li
          v-for="(line, index) in order.lines.slice(0, 2)"
          :key="`${order.id}-${index}`"
          class="text-sm text-ink/75"
        >
          {{ line.productName }}
          <span class="text-ink/50"> · {{ line.quantity }} шт.</span>
        </li>
      </ul>

      <p class="mt-4 text-lg font-bold text-ink">{{ order.total.toLocaleString('ru-RU') }} ₽</p>

      <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <NuxtLink
          :to="`/orders/${order.id}`"
          class="inline-flex min-h-11 items-center text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        >
          Открыть заказ
        </NuxtLink>
        <NuxtLink
          to="/orders"
          class="inline-flex min-h-11 items-center text-sm font-medium text-ink/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        >
          Все заказы
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
