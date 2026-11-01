<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { apiErrorMessage, requestHeaders } from '~/utils/apiError';
import { orderStatusLabel } from '~/utils/orderStatus';

definePageMeta({ layout: 'admin', middleware: 'admin' });

type AdminOrder = {
  id: string;
  status: string;
  statusLabel: string;
  paymentStatusLabel: string;
  adminComment: string | null;
  trackingNumber: string | null;
  firstName: string;
  phone: string;
  email: string;
  deliveryCity: string | null;
  deliveryAddress: string | null;
  deliveryPostalCode: string | null;
  deliveryComment: string | null;
  total: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  allowedStatuses: string[];
  lines: { productName: string; shade: string; size: string; quantity: number; price: number }[];
};

const route = useRoute();
const order = ref<AdminOrder | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const notice = ref<string | null>(null);
const adminComment = ref('');
const trackingNumber = ref('');

const shortId = computed(() => (order.value ? order.value.id.slice(-8).toUpperCase() : ''));

useHead(() => ({
  title: order.value ? `Заказ № ${shortId.value} — Admin` : 'Заказ — Admin',
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

async function load() {
  loading.value = true;
  error.value = null;
  try {
    order.value = await $fetch<AdminOrder>(`/api/admin/orders/${route.params.id}`, {
      headers: requestHeaders(),
    });
    adminComment.value = order.value.adminComment ?? '';
    trackingNumber.value = order.value.trackingNumber ?? '';
  } catch (reason) {
    error.value = apiErrorMessage(reason);
    order.value = null;
  } finally {
    loading.value = false;
  }
}

async function patch(body: Record<string, unknown>, success: string) {
  if (!order.value || saving.value) return;
  saving.value = true;
  error.value = null;
  notice.value = null;
  try {
    order.value = await $fetch<AdminOrder>(`/api/admin/orders/${order.value.id}`, {
      method: 'PATCH',
      headers: requestHeaders(),
      body,
    });
    adminComment.value = order.value.adminComment ?? '';
    trackingNumber.value = order.value.trackingNumber ?? '';
    notice.value = success;
  } catch (reason) {
    error.value = apiErrorMessage(reason);
  } finally {
    saving.value = false;
  }
}

async function setStatus(status: string) {
  const label = orderStatusLabel(status);
  const confirmed = status !== 'CANCELLED' || window.confirm('Отменить заказ и вернуть остатки на склад?');
  if (!confirmed) return;
  await patch({ status }, `Статус обновлён: ${label}`);
}

async function saveMeta() {
  await patch(
    {
      adminComment: adminComment.value.trim() || null,
      trackingNumber: trackingNumber.value.trim() || null,
    },
    'Комментарий и трек-номер сохранены',
  );
}

onMounted(load);
</script>

<template>
  <section>
    <NuxtLink to="/admin/orders" class="text-sm font-semibold text-cobalt hover:text-ink"
      >← Все заказы</NuxtLink
    >

    <p v-if="error" class="mt-6 text-sm text-error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="mt-8 text-sm text-ink/60">Загружаем заказ…</p>

    <div v-else-if="order" class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="min-w-0 border-t border-seam bg-white px-5 py-6 sm:px-6">
        <p class="type-label text-cobalt">ЗАКАЗ № {{ shortId }}</p>
        <h1 class="mt-2 text-3xl font-bold text-ink">{{ order.statusLabel }}</h1>
        <p class="mt-2 text-sm text-ink/60">Создан {{ formatWhen(order.createdAt) }}</p>
        <p class="mt-1 text-sm text-ink/60">Обновлён {{ formatWhen(order.updatedAt) }}</p>
        <p class="mt-3 text-sm font-medium text-ink">Оплата: {{ order.paymentStatusLabel }}</p>

        <div v-if="order.allowedStatuses.length" class="mt-6 flex flex-wrap gap-2">
          <button
            v-for="status in order.allowedStatuses"
            :key="status"
            type="button"
            class="shop-button-secondary"
            :disabled="saving"
            @click="setStatus(status)"
          >
            {{ orderStatusLabel(status) }}
          </button>
        </div>
        <p v-else class="mt-6 text-sm text-ink/55">Дальнейшие смены статуса недоступны.</p>

        <h2 class="mt-10 text-lg font-bold text-ink">Состав</h2>
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

        <h2 class="mt-10 text-lg font-bold text-ink">Покупатель и доставка</h2>
        <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-ink/50">Имя</dt>
            <dd class="mt-1 font-medium">{{ order.firstName }}</dd>
          </div>
          <div>
            <dt class="text-ink/50">Телефон</dt>
            <dd class="mt-1 font-medium">{{ order.phone }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-ink/50">Почта</dt>
            <dd class="mt-1 font-medium">{{ order.email }}</dd>
          </div>
          <div>
            <dt class="text-ink/50">Город</dt>
            <dd class="mt-1 font-medium">{{ order.deliveryCity || '—' }}</dd>
          </div>
          <div>
            <dt class="text-ink/50">Индекс</dt>
            <dd class="mt-1 font-medium">{{ order.deliveryPostalCode || '—' }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-ink/50">Адрес</dt>
            <dd class="mt-1 font-medium">{{ order.deliveryAddress || '—' }}</dd>
          </div>
          <div v-if="order.deliveryComment" class="sm:col-span-2">
            <dt class="text-ink/50">Комментарий покупателя</dt>
            <dd class="mt-1 font-medium">{{ order.deliveryComment }}</dd>
          </div>
        </dl>
      </div>

      <aside class="border border-seam bg-white p-5 sm:p-6 lg:sticky lg:top-6">
        <p class="type-label text-cobalt">ОБРАБОТКА</p>
        <p v-if="notice" class="mt-3 text-sm text-cobalt" role="status">{{ notice }}</p>
        <label class="mt-5 grid gap-2 text-sm font-semibold text-ink">
          Комментарий администратора
          <textarea
            v-model="adminComment"
            rows="4"
            maxlength="2000"
            class="border border-seam bg-white p-3 font-normal outline-none focus:border-cobalt"
          />
        </label>
        <label class="mt-4 grid gap-2 text-sm font-semibold text-ink">
          Трек-номер
          <input
            v-model.trim="trackingNumber"
            maxlength="120"
            class="h-12 border border-seam bg-white px-3 font-normal outline-none focus:border-cobalt"
          />
        </label>
        <button type="button" class="shop-button-primary mt-5 w-full" :disabled="saving" @click="saveMeta">
          СОХРАНИТЬ
        </button>
        <div class="mt-6 border-t border-seam pt-5 text-sm text-ink/70">
          <div class="flex justify-between gap-3">
            <span>Товары</span><span>{{ order.quantity }} шт.</span>
          </div>
          <div class="mt-2 flex justify-between gap-3"><span>Доставка</span><span>0 ₽</span></div>
          <div class="mt-4 flex justify-between gap-3 text-base font-bold text-ink">
            <span>Итого</span><span>{{ order.total.toLocaleString('ru-RU') }} ₽</span>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>
