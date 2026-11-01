<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAccountStore } from '~/stores/account';
import { useCartStore } from '~/stores/cart';
import { useNotificationsStore } from '~/stores/notifications';
import { apiErrorMessage } from '~/utils/apiError';

type CreatedOrder = {
  id: string;
  status: string;
  statusLabel: string;
  total: number;
  quantity: number;
  lines: { productName: string; shade: string; size: string; quantity: number; price: number }[];
};

type SummaryLine = {
  key: string;
  name: string;
  shade: string;
  size: string;
  quantity: number;
  lineTotal: number;
};

const cart = useCartStore();
const account = useAccountStore();
const notifications = useNotificationsStore();
const firstName = ref('');
const phone = ref('');
const email = ref('');
const deliveryCity = ref('');
const deliveryAddress = ref('');
const deliveryPostalCode = ref('');
const deliveryComment = ref('');
const error = ref<string | null>(null);
const submitting = ref(false);
const createdOrder = ref<CreatedOrder | null>(null);
const idempotencyKey = ref(
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
);
const authMode = ref<'login' | 'register' | null>(null);
const authVisible = ref(false);

function openAuth(mode: 'login' | 'register') {
  authMode.value = mode;
  authVisible.value = true;
}

function closeAuth() {
  authVisible.value = false;
}
function finishAuthClose() {
  if (!authVisible.value) authMode.value = null;
}

watch(
  () => account.profile,
  (profile) => {
    if (!profile) {
      email.value = '';
      firstName.value = '';
      phone.value = '';
      return;
    }
    email.value = profile.email;
    firstName.value = profile.firstName;
    phone.value = profile.phone;
  },
  { immediate: true },
);

const summaryLines = computed<SummaryLine[]>(() => {
  if (createdOrder.value) {
    return createdOrder.value.lines.map((line, index) => ({
      key: `${createdOrder.value!.id}-${index}`,
      name: line.productName,
      shade: line.shade,
      size: line.size,
      quantity: line.quantity,
      lineTotal: line.price * line.quantity,
    }));
  }
  return cart.activeLines.map((line) => ({
    key: line.key,
    name: line.product.name,
    shade: line.product.shade,
    size: line.size,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
  }));
});

const summaryTotal = computed(() => createdOrder.value?.total ?? cart.total);

async function submitOrder() {
  if (submitting.value) return;
  error.value = null;
  submitting.value = true;
  try {
    const order = await $fetch<CreatedOrder>('/api/orders', {
      method: 'POST',
      body: {
        firstName: firstName.value,
        phone: phone.value,
        email: email.value,
        deliveryCity: deliveryCity.value,
        deliveryAddress: deliveryAddress.value,
        deliveryPostalCode: deliveryPostalCode.value,
        deliveryComment: deliveryComment.value,
        expectedTotal: cart.total,
        idempotencyKey: idempotencyKey.value,
      },
    });
    createdOrder.value = order;
    await Promise.all([cart.load(), notifications.load()]);
    if (account.isAuthenticated) await account.refresh();
  } catch (reason) {
    error.value = apiErrorMessage(reason);
    await cart.load().catch(() => undefined);
  } finally {
    submitting.value = false;
  }
}

useHead({ title: 'Оформление заказа — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner title="ОФОРМЛЕНИЕ ЗАКАЗА" lead="Проверь выбранные размеры, количество и сумму заказа." />

    <div class="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
      <div class="min-w-0 border-t border-seam pt-7">
        <h2 class="text-2xl font-bold text-ink">
          {{ createdOrder ? 'Заказ создан' : 'Данные для оформления' }}
        </h2>
        <div v-if="createdOrder" class="mt-5 max-w-[640px]">
          <p class="text-sm leading-6 text-ink/70">
            Номер заказа
            <span class="font-semibold text-ink">{{ createdOrder.id.slice(-8).toUpperCase() }}</span
            >. Статус: <span class="font-semibold text-ink">{{ createdOrder.statusLabel }}</span
            >. Оплата условная: деньги не списаны. Способ доставки уточняется вручную.
          </p>
          <p class="mt-3 text-sm leading-6 text-ink/70">
            Уведомление отправлено на почту и сохранено в кабинете.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <NuxtLink :to="`/orders/${createdOrder.id}`" class="shop-button-primary">СМОТРЕТЬ ЗАКАЗ</NuxtLink>
            <NuxtLink
              to="/notifications"
              class="inline-flex h-12 items-center px-5 text-sm font-bold text-cobalt hover:text-ink"
              >Уведомления</NuxtLink
            >
          </div>
        </div>
        <div v-else-if="!account.isAuthenticated" class="mt-7 max-w-[640px]">
          <p class="text-sm leading-6 text-ink/70">
            Чтобы оформить заказ, войдите или зарегистрируйтесь. Товары в корзине сохранятся.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <button type="button" class="shop-button-primary" @click="openAuth('login')">ВОЙТИ</button>
            <button type="button" class="shop-button-primary" @click="openAuth('register')">
              РЕГИСТРАЦИЯ
            </button>
          </div>
        </div>
        <form v-else class="mt-7 grid gap-5 sm:grid-cols-2" @submit.prevent="submitOrder">
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink"
            >Имя<input
              v-model.trim="firstName"
              type="text"
              autocomplete="given-name"
              required
              placeholder="Как к вам обращаться"
              class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt"
          /></label>
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink"
            >Телефон<input
              v-model.trim="phone"
              type="tel"
              autocomplete="tel"
              required
              placeholder="+7"
              class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt"
          /></label>
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink sm:col-span-2"
            >Электронная почта<input
              v-model.trim="email"
              type="email"
              autocomplete="email"
              required
              placeholder="mail@example.ru"
              class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt"
          /></label>
          <p class="text-sm leading-6 text-ink/70 sm:col-span-2">
            Доставка по России бесплатная. Способ доставки уточняется вручную.
          </p>
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink"
            >Город
            <input
              v-model.trim="deliveryCity"
              required
              maxlength="120"
              autocomplete="address-level2"
              class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt"
            />
          </label>
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink"
            >Индекс
            <input
              v-model.trim="deliveryPostalCode"
              required
              pattern="[0-9]{6}"
              maxlength="6"
              inputmode="numeric"
              autocomplete="postal-code"
              placeholder="6 цифр"
              class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt"
            />
          </label>
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink sm:col-span-2"
            >Адрес доставки
            <input
              v-model.trim="deliveryAddress"
              required
              maxlength="300"
              autocomplete="street-address"
              placeholder="Улица, дом, квартира"
              class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt"
            />
          </label>
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink sm:col-span-2"
            >Комментарий к доставке
            <textarea
              v-model.trim="deliveryComment"
              maxlength="1000"
              rows="3"
              class="border border-seam bg-white p-4 font-normal outline-none focus:border-cobalt"
            />
          </label>
          <p class="text-sm leading-6 text-ink/70 sm:col-span-2">
            Оплата условная: деньги при оформлении не списываются.
          </p>
          <p v-if="error" class="text-sm text-error sm:col-span-2" role="alert">{{ error }}</p>
          <p v-if="cart.hasStockIssues" class="text-sm text-error sm:col-span-2" role="alert">
            Вернитесь в корзину и проверьте наличие и количество товаров.
          </p>
          <button
            type="submit"
            class="shop-button-primary sm:col-span-2"
            :disabled="submitting || !cart.activeLines.length || cart.hasStockIssues"
          >
            ОФОРМИТЬ ЗАКАЗ
          </button>
        </form>
        <NuxtLink
          v-if="!createdOrder"
          to="/cart"
          class="mt-8 inline-flex text-sm font-semibold text-cobalt hover:text-ink"
          >← Вернуться в корзину</NuxtLink
        >
      </div>

      <aside class="bg-ice p-6 sm:p-8 lg:sticky lg:top-28" aria-label="Состав заказа">
        <p class="type-label text-cobalt">ВАШ ЗАКАЗ</p>
        <h2 class="mt-3 text-2xl font-bold text-ink">Состав заказа</h2>
        <ul class="mt-6 divide-y divide-ink/15 border-y border-ink/15">
          <li v-for="line in summaryLines" :key="line.key" class="py-4">
            <p class="text-sm font-semibold text-ink">{{ line.name }}</p>
            <p class="mt-1 text-xs text-ink/60">
              {{ line.shade }} · размер {{ line.size }} · {{ line.quantity }} шт.
            </p>
            <p class="mt-2 text-sm font-bold text-ink">{{ line.lineTotal.toLocaleString('ru-RU') }} ₽</p>
          </li>
          <li v-if="!summaryLines.length" class="py-5 text-sm text-ink/60">
            В корзине нет товаров для оформления.
          </li>
        </ul>
        <div class="mt-5 flex justify-between gap-4 text-sm text-ink/70">
          <span>Доставка</span><span>Бесплатно · 0 ₽</span>
        </div>
        <div class="mt-5 flex items-baseline justify-between gap-4 text-lg font-bold text-ink">
          <span>Итого</span><span>{{ summaryTotal.toLocaleString('ru-RU') }} ₽</span>
        </div>
      </aside>
    </div>
    <AuthModal
      v-if="authMode"
      :mode="authMode"
      :visible="authVisible"
      @close="closeAuth"
      @after-leave="finishAuthClose"
      @switch="authMode = $event"
      @success="closeAuth"
    />
  </section>
</template>
