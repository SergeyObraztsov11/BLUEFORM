<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { apiErrorMessage, requestHeaders } from '~/utils/apiError';

definePageMeta({ middleware: 'account' });

type OrderDetail = {
  id: string;
  status: string;
  statusLabel: string;
  email: string;
  firstName: string;
  phone: string;
  deliveryCity: string | null;
  deliveryAddress: string | null;
  deliveryPostalCode: string | null;
  deliveryComment: string | null;
  total: number;
  quantity: number;
  createdAt: string;
  lines: { productName: string; shade: string; size: string; quantity: number; price: number }[];
};

const route = useRoute();
const order = ref<OrderDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const shortId = computed(() => (order.value ? order.value.id.slice(-8).toUpperCase() : ''));

useHead(() => ({
  title: order.value ? `Заказ № ${shortId.value} — BLUEFORM` : 'Заказ — BLUEFORM',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
}));

function formatWhen(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    order.value = await $fetch<OrderDetail>(`/api/orders/${route.params.id}`, {
      headers: requestHeaders(),
    });
  } catch (reason) {
    error.value = apiErrorMessage(reason);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner
      :title="order ? `ЗАКАЗ № ${shortId}` : 'ЗАКАЗ'"
      lead="Состав, доставка и текущий статус."
    />

    <NuxtLink to="/orders" class="mt-6 inline-flex text-sm font-semibold text-cobalt hover:text-ink"
      >← Все заказы</NuxtLink
    >

    <p v-if="error" class="mt-6 text-sm text-error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="mt-10 text-sm text-ink/60">Загружаем заказ…</p>

    <div v-else-if="order" class="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
      <div class="min-w-0 border-t border-seam pt-7">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="type-label text-cobalt">СТАТУС</p>
            <h2 class="mt-2 text-2xl font-bold text-ink">{{ order.statusLabel }}</h2>
            <p class="mt-2 text-sm text-ink/60">{{ formatWhen(order.createdAt) }}</p>
          </div>
          <p class="text-sm text-ink/60">Оплата условная · деньги не списаны</p>
        </div>

        <h3 class="mt-10 text-lg font-bold text-ink">Состав</h3>
        <ul class="mt-4 divide-y divide-seam border-y border-seam">
          <li v-for="(line, index) in order.lines" :key="index" class="flex justify-between gap-4 py-4">
            <div>
              <p class="text-sm font-semibold text-ink">{{ line.productName }}</p>
              <p class="mt-1 text-xs text-ink/60">
                {{ line.shade }} · размер {{ line.size }} · {{ line.quantity }} шт.
              </p>
            </div>
            <p class="shrink-0 text-sm font-bold text-ink">
              {{ (line.price * line.quantity).toLocaleString('ru-RU') }} ₽
            </p>
          </li>
        </ul>

        <h3 class="mt-10 text-lg font-bold text-ink">Доставка и контакты</h3>
        <dl class="mt-4 grid gap-3 text-sm text-ink/80 sm:grid-cols-2">
          <div>
            <dt class="text-ink/50">Имя</dt>
            <dd class="mt-1 font-medium text-ink">{{ order.firstName }}</dd>
          </div>
          <div>
            <dt class="text-ink/50">Телефон</dt>
            <dd class="mt-1 font-medium text-ink">{{ order.phone }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-ink/50">Почта</dt>
            <dd class="mt-1 font-medium text-ink">{{ order.email }}</dd>
          </div>
          <div>
            <dt class="text-ink/50">Город</dt>
            <dd class="mt-1 font-medium text-ink">{{ order.deliveryCity || '—' }}</dd>
          </div>
          <div>
            <dt class="text-ink/50">Индекс</dt>
            <dd class="mt-1 font-medium text-ink">{{ order.deliveryPostalCode || '—' }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-ink/50">Адрес</dt>
            <dd class="mt-1 font-medium text-ink">{{ order.deliveryAddress || '—' }}</dd>
          </div>
          <div v-if="order.deliveryComment" class="sm:col-span-2">
            <dt class="text-ink/50">Комментарий</dt>
            <dd class="mt-1 font-medium text-ink">{{ order.deliveryComment }}</dd>
          </div>
        </dl>
      </div>

      <aside class="bg-ice p-6 sm:p-8 lg:sticky lg:top-28" aria-label="Итог заказа">
        <p class="type-label text-cobalt">ИТОГО</p>
        <div class="mt-5 flex justify-between gap-4 text-sm text-ink/70">
          <span>Товары</span><span>{{ order.quantity }} шт.</span>
        </div>
        <div class="mt-3 flex justify-between gap-4 text-sm text-ink/70">
          <span>Доставка</span><span>Бесплатно · 0 ₽</span>
        </div>
        <div class="mt-5 flex items-baseline justify-between gap-4 border-t border-ink/15 pt-5 text-lg font-bold text-ink">
          <span>Сумма</span><span>{{ order.total.toLocaleString('ru-RU') }} ₽</span>
        </div>
        <p class="mt-4 text-xs leading-5 text-ink/55">
          Способ доставки уточняется вручную. Статус обновится, когда заказ возьмут в работу.
        </p>
      </aside>
    </div>
  </section>
</template>
