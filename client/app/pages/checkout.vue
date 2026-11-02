<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAccountStore } from '~/stores/account';
import { useCartStore } from '~/stores/cart';
import { useNotificationsStore } from '~/stores/notifications';
import type { CheckoutSummaryLine } from '~/types/checkout';
import { apiErrorMessage } from '~/utils/apiError';

type CreatedOrder = {
  id: string;
  status: string;
  statusLabel: string;
  total: number;
  quantity: number;
  lines: { productName: string; shade: string; size: string; quantity: number; price: number }[];
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
const cartBootError = ref<string | null>(null);
const cartBooting = ref(false);
const submitting = ref(false);
const createdOrder = ref<CreatedOrder | null>(null);
const idempotencyKey = ref(
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
);
const authMode = ref<'login' | 'register' | null>(null);
const authVisible = ref(false);

const cartReady = computed(() => cart.loaded && !cartBooting.value);
const cartIsEmpty = computed(() => cartReady.value && !createdOrder.value && cart.activeLines.length === 0);
const showCheckoutForm = computed(
  () =>
    cartReady.value &&
    !cartBootError.value &&
    !createdOrder.value &&
    account.isAuthenticated &&
    cart.activeLines.length > 0,
);
const showSummary = computed(
  () =>
    Boolean(createdOrder.value) || (cartReady.value && !cartBootError.value && cart.activeLines.length > 0),
);

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

async function ensureCartLoaded() {
  if (cartBooting.value) return;
  cartBooting.value = true;
  cartBootError.value = null;
  try {
    await cart.load();
  } catch (reason) {
    cartBootError.value = apiErrorMessage(reason);
  } finally {
    cartBooting.value = false;
  }
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

const summaryLines = computed<CheckoutSummaryLine[]>(() => {
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
const summaryQuantity = computed(() => createdOrder.value?.quantity ?? cart.totalQuantity);

async function submitOrder() {
  if (submitting.value || !cart.activeLines.length || cart.hasStockIssues) return;
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

onMounted(() => {
  if (!cart.loaded) void ensureCartLoaded();
});

useHead({ title: 'Оформление заказа — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-6 md:pt-8">
    <ShopPageHeader :title="createdOrder ? 'Заказ оформлен' : 'Оформление заказа'" />

    <form
      v-if="showCheckoutForm"
      class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-x-12 lg:gap-y-8 lg:[grid-template-areas:'fields_summary''actions_summary']"
      @submit.prevent="submitOrder"
    >
      <div class="grid min-w-0 gap-5 sm:grid-cols-2 lg:[grid-area:fields]">
        <h2 class="text-lg font-semibold text-ink sm:col-span-2">Контакты</h2>
        <label class="flex flex-col gap-2 text-sm font-semibold text-ink">
          Имя
          <input
            v-model.trim="firstName"
            type="text"
            autocomplete="given-name"
            required
            maxlength="80"
            placeholder="Как к вам обращаться"
            class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
          />
        </label>
        <label class="flex flex-col gap-2 text-sm font-semibold text-ink">
          Телефон
          <input
            v-model.trim="phone"
            type="tel"
            autocomplete="tel"
            required
            maxlength="32"
            placeholder="+7"
            class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
          />
        </label>
        <label class="flex flex-col gap-2 text-sm font-semibold text-ink sm:col-span-2">
          Электронная почта
          <input
            v-model.trim="email"
            type="email"
            autocomplete="email"
            required
            placeholder="mail@example.ru"
            class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
          />
        </label>

        <div class="sm:col-span-2">
          <h2 class="text-lg font-semibold text-ink">Доставка</h2>
          <p class="mt-2 text-sm leading-6 text-ink/65">
            Доставка по России бесплатная. Способ доставки уточняется вручную.
          </p>
        </div>

        <label class="flex flex-col gap-2 text-sm font-semibold text-ink">
          Город
          <input
            v-model.trim="deliveryCity"
            required
            maxlength="120"
            autocomplete="address-level2"
            class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
          />
        </label>
        <label class="flex flex-col gap-2 text-sm font-semibold text-ink">
          Индекс
          <input
            v-model.trim="deliveryPostalCode"
            required
            pattern="[0-9]{6}"
            maxlength="6"
            inputmode="numeric"
            autocomplete="postal-code"
            placeholder="6 цифр"
            class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
          />
        </label>
        <label class="flex flex-col gap-2 text-sm font-semibold text-ink sm:col-span-2">
          Адрес доставки
          <input
            v-model.trim="deliveryAddress"
            required
            maxlength="300"
            autocomplete="street-address"
            placeholder="Улица, дом, квартира"
            class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
          />
        </label>
        <label class="flex flex-col gap-2 text-sm font-semibold text-ink sm:col-span-2">
          Комментарий к доставке
          <textarea
            v-model.trim="deliveryComment"
            maxlength="1000"
            rows="3"
            class="border border-seam bg-white p-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
          />
        </label>
      </div>

      <CheckoutSummary
        class="lg:[grid-area:summary]"
        :lines="summaryLines"
        :total="summaryTotal"
        :quantity="summaryQuantity"
      />

      <div class="grid min-w-0 gap-4 lg:[grid-area:actions]">
        <p class="text-sm leading-6 text-ink/70">При оформлении деньги не списываются.</p>
        <p v-if="error" class="text-sm text-error" role="alert">{{ error }}</p>
        <p v-if="cart.hasStockIssues" class="text-sm text-error" role="alert">
          Вернитесь в корзину и проверьте наличие и количество товаров.
        </p>
        <button
          type="submit"
          class="shop-button-primary w-full sm:w-auto"
          :disabled="submitting || !cart.activeLines.length || cart.hasStockIssues"
        >
          {{ submitting ? 'Оформляем…' : 'Оформить заказ' }}
        </button>
        <NuxtLink
          to="/cart"
          class="inline-flex text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        >
          ← Вернуться в корзину
        </NuxtLink>
      </div>
    </form>

    <div
      v-else
      class="grid items-start gap-8"
      :class="showSummary ? 'lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12' : 'lg:grid-cols-1'"
    >
      <div class="min-w-0">
        <div v-if="cartBooting || (!cart.loaded && !cartBootError)" role="status" aria-live="polite">
          <p class="text-sm text-ink/60">Загружаем корзину…</p>
        </div>

        <div v-else-if="cartBootError" class="max-w-[640px]">
          <p class="text-sm text-error" role="alert">{{ cartBootError }}</p>
          <button type="button" class="shop-button-primary mt-6" @click="ensureCartLoaded">Повторить</button>
        </div>

        <div v-else-if="createdOrder" class="max-w-[640px]">
          <p class="text-sm leading-6 text-ink/70">
            Номер
            <span class="font-semibold text-ink">{{ createdOrder.id.slice(-8).toUpperCase() }}</span>
            · статус
            <span class="font-semibold text-ink">{{ createdOrder.statusLabel }}</span>
          </p>
          <p class="mt-3 text-sm leading-6 text-ink/70">При оформлении деньги не списаны.</p>
          <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <NuxtLink :to="`/orders/${createdOrder.id}`" class="shop-button-primary">Открыть заказ</NuxtLink>
            <NuxtLink
              to="/orders"
              class="text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              Все заказы
            </NuxtLink>
            <NuxtLink
              to="/notifications"
              class="text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              Уведомления
            </NuxtLink>
          </div>
        </div>

        <div v-else-if="cartIsEmpty" class="py-10 text-center sm:py-12">
          <p class="text-base font-semibold text-ink">Корзина пуста</p>
          <NuxtLink to="/catalog" class="shop-button-primary mt-5">В каталог</NuxtLink>
        </div>

        <div v-else-if="!account.isAuthenticated" class="max-w-[640px]">
          <h2 class="text-xl font-bold text-ink">Войдите для оформления</h2>
          <p class="mt-3 text-sm leading-6 text-ink/70">Товары в корзине сохранятся.</p>
          <div class="mt-6 flex flex-wrap gap-3">
            <button type="button" class="shop-button-primary" @click="openAuth('login')">Войти</button>
            <button type="button" class="shop-button-secondary" @click="openAuth('register')">
              Регистрация
            </button>
          </div>
          <NuxtLink
            to="/cart"
            class="mt-8 inline-flex text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            ← Вернуться в корзину
          </NuxtLink>
        </div>
      </div>

      <CheckoutSummary
        v-if="showSummary"
        :lines="summaryLines"
        :total="summaryTotal"
        :quantity="summaryQuantity"
      />
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
