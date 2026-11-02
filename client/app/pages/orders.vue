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
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner title="ЗАКАЗЫ" lead="Статус, состав и сумма каждого оформленного заказа." />

    <div class="mt-8 border-t-2 border-ink pt-6 lg:mt-12">
      <p class="type-label text-cobalt">ИСТОРИЯ</p>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Мои заказы</h2>
      <p class="mt-3 max-w-lg text-sm leading-6 text-ink/65">
        Откройте заказ, чтобы посмотреть состав, доставку и актуальный статус.
      </p>
    </div>

    <div v-if="loading" class="mt-10" role="status" aria-live="polite">
      <p class="text-sm text-ink/60">Загружаем заказы…</p>
    </div>

    <div v-else-if="error" class="mt-10 max-w-[640px]">
      <p class="text-sm text-error" role="alert">{{ error }}</p>
      <button type="button" class="shop-button-primary mt-6" @click="loadOrders">ПОВТОРИТЬ</button>
    </div>

    <ul
      v-else-if="items.length"
      class="mt-8 divide-y divide-seam border-y border-seam"
      aria-label="Список заказов"
    >
      <li v-for="order in items" :key="order.id">
        <NuxtLink
          :to="`/orders/${order.id}`"
          class="block py-5 transition-colors hover:bg-ice/50 focus-visible:bg-ice/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt sm:py-6"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="type-label text-cobalt">ЗАКАЗ № {{ shortId(order.id) }}</p>
              <h3 class="mt-2 text-lg font-bold text-ink">{{ order.statusLabel }}</h3>
              <p class="mt-1 text-sm text-ink/60">{{ formatWhen(order.createdAt) }}</p>
            </div>
            <div class="text-left sm:text-right">
              <p class="text-lg font-bold text-ink">{{ order.total.toLocaleString('ru-RU') }} ₽</p>
              <p class="mt-1 text-xs text-ink/55">{{ order.quantity }} шт. · доставка бесплатно</p>
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
          <p class="mt-4 text-sm font-semibold text-cobalt">Подробнее →</p>
        </NuxtLink>
      </li>
    </ul>

    <div v-else class="mt-10 max-w-[480px] py-10 text-center sm:mx-auto">
      <p class="text-lg font-semibold text-ink">Заказов пока нет</p>
      <p class="mt-2 text-sm leading-6 text-ink/60">
        Когда оформите заказ, он появится здесь со статусом и составом.
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <NuxtLink to="/catalog" class="shop-button-primary">ПЕРЕЙТИ В КАТАЛОГ</NuxtLink>
        <NuxtLink
          to="/cart"
          class="inline-flex h-12 items-center px-5 text-sm font-bold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        >
          Корзина
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
