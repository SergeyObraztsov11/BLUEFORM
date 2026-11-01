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
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="type-label text-cobalt">АДМИН</p>
        <h1 class="mt-2 text-3xl font-bold text-ink">Заказы</h1>
        <p class="mt-2 text-sm text-ink/65">Поиск по номеру, телефону, почте или трек-номеру.</p>
        <p v-if="newCount" class="mt-3 text-sm font-semibold text-cobalt">Новых заказов: {{ newCount }}</p>
      </div>
      <form class="flex w-full max-w-md gap-2" @submit.prevent="search">
        <input
          v-model.trim="q"
          type="search"
          placeholder="Номер или телефон"
          class="h-12 min-w-0 flex-1 border border-seam bg-white px-4 outline-none focus:border-cobalt"
        />
        <button type="submit" class="shop-button-primary shrink-0 px-5">НАЙТИ</button>
      </form>
    </div>

    <p v-if="error" class="mt-6 text-sm text-error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="mt-8 text-sm text-ink/60">Загружаем заказы…</p>

    <ul v-else-if="items.length" class="mt-8 divide-y divide-seam border-y border-seam bg-white">
      <li v-for="order in items" :key="order.id">
        <NuxtLink
          :to="`/admin/orders/${order.id}`"
          class="block px-4 py-5 transition-colors hover:bg-ice/70 sm:px-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="type-label text-cobalt">№ {{ shortId(order.id) }}</p>
              <h2 class="mt-2 text-lg font-bold text-ink">{{ order.statusLabel }}</h2>
              <p class="mt-1 text-sm text-ink/60">{{ formatWhen(order.createdAt) }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-ink">{{ order.total.toLocaleString('ru-RU') }} ₽</p>
              <p class="mt-1 text-xs text-ink/55">{{ order.paymentStatusLabel }}</p>
            </div>
          </div>
          <p class="mt-3 text-sm text-ink/75">
            {{ order.firstName }} · {{ order.phone }} · {{ order.email }}
          </p>
          <p class="mt-2 text-sm text-ink/60">
            {{ order.lines[0]?.productName }}
            <template v-if="order.lines.length > 1"> и ещё {{ order.lines.length - 1 }}</template>
            · {{ order.quantity }} шт.
          </p>
        </NuxtLink>
      </li>
    </ul>

    <div v-else class="mt-10 border border-seam bg-white px-6 py-12 text-center">
      <p class="text-lg font-semibold text-ink">Заказов не найдено</p>
      <p class="mt-2 text-sm text-ink/60">
        {{ q ? 'Попробуйте другой запрос.' : 'Новые заказы появятся здесь после оформления.' }}
      </p>
    </div>

    <p class="mt-6 text-xs text-ink/45">
      Статусы: {{ ['NEW', 'PROCESSING', 'SHIPPED', 'CANCELLED'].map(orderStatusLabel).join(' · ') }}
    </p>
  </section>
</template>
