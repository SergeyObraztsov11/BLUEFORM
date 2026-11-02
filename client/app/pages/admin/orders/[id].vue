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
  notice.value = null;
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
    <NuxtLink
      to="/admin/orders"
      class="inline-flex text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
    >
      ← Все заказы
    </NuxtLink>

    <div v-if="loading" class="mt-10" role="status" aria-live="polite">
      <p class="text-sm text-ink/60">Загружаем заказ…</p>
    </div>

    <div v-else-if="error && !order" class="mt-10 max-w-[640px]">
      <div class="border border-error/25 bg-ice/60 px-4 py-4" role="alert">
        <p class="text-sm text-error">{{ error }}</p>
      </div>
      <div class="mt-6 flex flex-wrap gap-3">
        <button type="button" class="shop-button-primary" @click="load">ПОВТОРИТЬ</button>
        <NuxtLink
          to="/admin/orders"
          class="inline-flex h-12 items-center px-5 text-sm font-bold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        >
          К списку заказов
        </NuxtLink>
      </div>
    </div>

    <div v-else-if="!order" class="mt-10 max-w-[480px] border border-seam bg-white px-6 py-12 text-center">
      <p class="text-lg font-semibold text-ink">Заказ не найден</p>
      <p class="mt-2 text-sm leading-6 text-ink/60">Проверьте ссылку или вернитесь к списку заказов.</p>
      <NuxtLink to="/admin/orders" class="shop-button-primary mt-6">К СПИСКУ ЗАКАЗОВ</NuxtLink>
    </div>

    <div v-else-if="order" class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="min-w-0 border-t-2 border-ink bg-white px-5 py-6 sm:px-6">
        <p class="type-label text-cobalt">ЗАКАЗ № {{ shortId }}</p>
        <h1 class="mt-3 text-3xl font-bold tracking-tight text-ink">{{ order.statusLabel }}</h1>
        <p class="mt-2 text-sm text-ink/60">Создан {{ formatWhen(order.createdAt) }}</p>
        <p class="mt-1 text-sm text-ink/60">Обновлён {{ formatWhen(order.updatedAt) }}</p>
        <p class="mt-3 text-sm font-medium text-ink">Оплата: {{ order.paymentStatusLabel }}</p>

        <div
          v-if="error"
          class="mt-5 border border-error/25 bg-ice/60 px-4 py-3 text-sm text-error"
          role="alert"
        >
          {{ error }}
        </div>

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
        <ul class="mt-4 divide-y divide-seam border-y border-seam" aria-label="Состав заказа">
          <li v-for="(line, index) in order.lines" :key="index" class="flex justify-between gap-4 py-4">
            <div class="min-w-0">
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
            <dd class="mt-1 font-medium text-ink">{{ order.firstName }}</dd>
          </div>
          <div>
            <dt class="text-ink/50">Телефон</dt>
            <dd class="mt-1 font-medium text-ink">{{ order.phone }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-ink/50">Почта</dt>
            <dd class="mt-1 break-all font-medium text-ink">{{ order.email }}</dd>
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
            <dt class="text-ink/50">Комментарий покупателя</dt>
            <dd class="mt-1 font-medium text-ink">{{ order.deliveryComment }}</dd>
          </div>
        </dl>
      </div>

      <aside class="border border-seam bg-white p-5 sm:p-6 lg:sticky lg:top-6" aria-label="Обработка заказа">
        <p class="type-label text-cobalt">ОБРАБОТКА</p>
        <p v-if="notice" class="mt-3 text-sm font-semibold text-cobalt" role="status">{{ notice }}</p>
        <label class="mt-5 grid gap-2 text-sm font-semibold text-ink">
          Комментарий администратора
          <textarea
            v-model="adminComment"
            rows="4"
            maxlength="2000"
            class="border border-seam bg-white p-3 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
          />
        </label>
        <label class="mt-4 grid gap-2 text-sm font-semibold text-ink">
          Трек-номер
          <input
            v-model.trim="trackingNumber"
            maxlength="120"
            class="h-12 border border-seam bg-white px-3 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
          />
        </label>
        <button
          type="button"
          class="shop-button-primary mt-5 w-full"
          :disabled="saving"
          :aria-busy="saving"
          @click="saveMeta"
        >
          {{ saving ? 'СОХРАНЯЕМ…' : 'СОХРАНИТЬ' }}
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
