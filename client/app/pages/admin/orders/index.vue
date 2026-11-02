<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { apiErrorMessage, requestHeaders } from '~/utils/apiError';
import { orderStatusLabel } from '~/utils/orderStatus';

definePageMeta({ layout: 'admin', middleware: 'admin' });
useHead({ title: 'Заказы — Admin BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });

type AdminOrder = {
  id: string;
  status: string;
  statusLabel: string;
  paymentStatusLabel: string;
  firstName: string;
  phone: string;
  email: string;
  total: number;
  quantity: number;
  createdAt: string;
  lines: { productName: string; shade: string; size: string; quantity: number }[];
};

const route = useRoute();
const router = useRouter();
const q = ref(typeof route.query.q === 'string' ? route.query.q : '');
const items = ref<AdminOrder[]>([]);
const newCount = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);

function shortId(id: string) {
  return id.slice(-8).toUpperCase();
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const response = await $fetch<{ items: AdminOrder[]; newCount: number }>('/api/admin/orders', {
      headers: requestHeaders(),
      query: q.value.trim() ? { q: q.value.trim() } : undefined,
    });
    items.value = response.items;
    newCount.value = response.newCount;
  } catch (reason) {
    error.value = apiErrorMessage(reason);
    items.value = [];
    newCount.value = 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  void router.replace({ query: q.value.trim() ? { q: q.value.trim() } : {} });
}

function clearSearch() {
  q.value = '';
  void router.replace({ query: {} });
}

watch(
  () => route.query.q,
  () => {
    q.value = typeof route.query.q === 'string' ? route.query.q : '';
    void load();
  },
);

onMounted(load);
</script>

<template>
  <section>
    <div class="border-t-2 border-ink pt-6">
      <p class="type-label text-cobalt">АДМИН</p>
      <h1 class="mt-3 text-3xl font-bold tracking-tight text-ink">Заказы</h1>
      <p class="mt-3 max-w-xl text-sm leading-6 text-ink/65">
        Поиск по номеру заказа, телефону, почте или трек-номеру.
      </p>
      <p v-if="!loading && !error && newCount" class="mt-3 text-sm font-semibold text-cobalt">
        Новых заказов: {{ newCount }}
      </p>
    </div>

    <form
      class="mt-8 grid gap-3 border border-seam bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5"
      @submit.prevent="search"
    >
      <label class="grid gap-2 text-sm font-semibold text-ink">
        Поиск заказов
        <input
          id="admin-orders-search"
          v-model.trim="q"
          type="search"
          name="q"
          autocomplete="off"
          placeholder="Номер, телефон, почта или трек"
          aria-describedby="admin-orders-search-hint"
          class="h-12 min-w-0 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
        />
      </label>
      <div class="flex flex-wrap gap-2">
        <button type="submit" class="shop-button-primary shrink-0 px-5" :disabled="loading">НАЙТИ</button>
        <button
          v-if="q"
          type="button"
          class="inline-flex h-12 items-center px-4 text-sm font-bold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          @click="clearSearch"
        >
          Сбросить
        </button>
      </div>
      <p id="admin-orders-search-hint" class="text-xs leading-5 text-ink/50 sm:col-span-2">
        Можно искать по короткому номеру, телефону, почте покупателя или трек-номеру доставки.
      </p>
    </form>

    <div v-if="loading" class="mt-10" role="status" aria-live="polite">
      <p class="text-sm text-ink/60">Загружаем заказы…</p>
    </div>

    <div v-else-if="error" class="mt-10 max-w-[640px]">
      <div class="border border-error/25 bg-ice/60 px-4 py-4" role="alert">
        <p class="text-sm text-error">{{ error }}</p>
      </div>
      <button type="button" class="shop-button-primary mt-6" @click="load">ПОВТОРИТЬ</button>
    </div>

    <ul
      v-else-if="items.length"
      class="mt-8 divide-y divide-seam border-y border-seam bg-white"
      aria-label="Список заказов"
    >
      <li v-for="order in items" :key="order.id">
        <NuxtLink
          :to="`/admin/orders/${order.id}`"
          class="block px-4 py-5 transition-colors hover:bg-ice/70 focus-visible:bg-ice/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt sm:px-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="type-label text-cobalt">№ {{ shortId(order.id) }}</p>
              <h2 class="mt-2 text-lg font-bold text-ink">{{ order.statusLabel }}</h2>
              <p class="mt-1 text-sm text-ink/60">{{ formatWhen(order.createdAt) }}</p>
            </div>
            <div class="text-left sm:text-right">
              <p class="text-lg font-bold text-ink">{{ order.total.toLocaleString('ru-RU') }} ₽</p>
              <p class="mt-1 text-xs text-ink/55">{{ order.paymentStatusLabel }}</p>
            </div>
          </div>
          <p class="mt-3 break-all text-sm text-ink/75">
            {{ order.firstName }} · {{ order.phone }} · {{ order.email }}
          </p>
          <p class="mt-2 text-sm text-ink/60">
            {{ order.lines[0]?.productName }}
            <template v-if="order.lines.length > 1"> и ещё {{ order.lines.length - 1 }}</template>
            · {{ order.quantity }} шт.
          </p>
          <p class="mt-4 text-sm font-semibold text-cobalt">Открыть заказ →</p>
        </NuxtLink>
      </li>
    </ul>

    <div v-else class="mt-10 border border-seam bg-white px-6 py-12 text-center">
      <p class="text-lg font-semibold text-ink">
        {{ q ? 'Заказов не найдено' : 'Заказов пока нет' }}
      </p>
      <p class="mt-2 text-sm leading-6 text-ink/60">
        {{
          q
            ? 'Попробуйте другой запрос или сбросьте поиск.'
            : 'Новые заказы появятся здесь после оформления на сайте.'
        }}
      </p>
      <button v-if="q" type="button" class="shop-button-primary mt-6" @click="clearSearch">
        СБРОСИТЬ ПОИСК
      </button>
    </div>

    <p class="mt-6 text-xs leading-5 text-ink/45">
      Статусы: {{ ['NEW', 'PROCESSING', 'SHIPPED', 'CANCELLED'].map(orderStatusLabel).join(' · ') }}
    </p>
  </section>
</template>
