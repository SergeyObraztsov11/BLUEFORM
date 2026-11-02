<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCartStore } from '~/stores/cart';
import { useFavoritesStore } from '~/stores/favorites';
import type { CollectionKind } from '~/types/collection';
import { apiErrorMessage } from '~/utils/apiError';

const props = defineProps<{ kind: CollectionKind }>();
const isCart = computed(() => props.kind === 'cart');
const cart = useCartStore();
const favorites = useFavoritesStore();
const items = computed(() => favorites.items);

const retrying = ref(false);
const bootError = ref<string | null>(null);

const storeLoaded = computed(() => (isCart.value ? cart.loaded : favorites.loaded));
const pageError = computed(() => bootError.value || (isCart.value ? cart.error : favorites.error));
const isLoading = computed(() => !storeLoaded.value && !bootError.value && !retrying.value);
const showCartSummary = computed(() => isCart.value && storeLoaded.value && cart.lines.length > 0);
const cartIsEmpty = computed(() => isCart.value && storeLoaded.value && !cart.lines.length);
const favoritesIsEmpty = computed(() => !isCart.value && storeLoaded.value && !items.value.length);

/** Visible cart units including out-of-stock lines; excludes removed. */
const cartDisplayQuantity = computed(() => cart.lines.reduce((sum, line) => sum + line.quantity, 0));

const cartCountLabel = computed(() => {
  const count = cartDisplayQuantity.value;
  if (!count) return '';
  const remainder = count % 10;
  const teen = count % 100 >= 11 && count % 100 <= 14;
  const noun =
    remainder === 1 && !teen ? 'товар' : remainder >= 2 && remainder <= 4 && !teen ? 'товара' : 'товаров';
  return `${count} ${noun}`;
});

async function retryLoad() {
  retrying.value = true;
  bootError.value = null;
  try {
    if (isCart.value) {
      await cart.load();
      cart.error = null;
    } else {
      await favorites.load();
      favorites.error = null;
    }
  } catch (reason) {
    bootError.value = apiErrorMessage(reason);
  } finally {
    retrying.value = false;
  }
}

function dismissMutationError() {
  if (isCart.value) cart.error = null;
  else favorites.error = null;
  bootError.value = null;
}
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-6 md:pt-8">
    <ShopPageHeader
      :title="isCart ? 'Корзина' : 'Избранное'"
      :meta="isCart && storeLoaded && cartDisplayQuantity > 0 ? cartCountLabel : undefined"
    />

    <div v-if="pageError" class="mb-8 max-w-[640px] border border-error/25 bg-ice/60 p-5 sm:p-6" role="alert">
      <p class="text-sm font-semibold text-error">Не удалось выполнить действие</p>
      <p class="mt-2 text-sm leading-6 text-ink/70">{{ pageError }}</p>
      <div class="mt-5 flex flex-wrap gap-3">
        <button type="button" class="shop-button-primary" :disabled="retrying" @click="retryLoad">
          {{ retrying ? 'Загрузка…' : 'Повторить' }}
        </button>
        <button
          type="button"
          class="inline-flex h-12 items-center px-4 text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          @click="dismissMutationError"
        >
          Скрыть
        </button>
      </div>
    </div>

    <div v-if="isLoading || retrying" role="status" aria-live="polite">
      <p class="text-sm text-ink/60">{{ isCart ? 'Загружаем корзину…' : 'Загружаем избранное…' }}</p>
    </div>

    <div
      v-else-if="storeLoaded"
      class="grid items-start gap-8"
      :class="showCartSummary ? 'lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10' : 'lg:grid-cols-1'"
    >
      <div class="min-w-0">
        <template v-if="isCart">
          <div v-if="cart.lines.length" aria-label="Список товаров в корзине">
            <CartItemRow
              v-for="line in cart.lines"
              :key="line.key"
              :item="line.product"
              :size="line.size"
              :quantity="line.quantity"
              :is-favorite="favorites.isFavorite(line.product.id)"
              @update:size="cart.changeSize(line.key, $event)"
              @update:quantity="cart.updateSelection(line.key, { quantity: $event })"
              @toggle:favorite="favorites.toggleFavorite(line.product.id)"
              @remove="cart.updateSelection(line.key, { removed: true })"
            />
          </div>

          <div v-else-if="cartIsEmpty" class="py-10 text-center sm:py-12">
            <p class="text-base font-semibold text-ink">Корзина пуста</p>
            <NuxtLink to="/catalog" class="shop-button-primary mt-5">В каталог</NuxtLink>
          </div>

          <div
            v-if="cart.removedLines.length"
            class="mt-6 border border-seam bg-ice/50 px-4 py-5 sm:px-5"
            aria-label="Удалённые товары"
          >
            <p class="text-xs font-semibold tracking-wide text-ink/55">Удалено из корзины</p>
            <ul class="mt-4 space-y-3">
              <li
                v-for="line in cart.removedLines"
                :key="line.key"
                class="flex flex-wrap items-center justify-between gap-3 text-sm text-ink/65"
              >
                <span>{{ line.product.name }} · {{ line.product.shade }} · размер {{ line.size }}</span>
                <button
                  type="button"
                  class="font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                  :aria-label="`Вернуть в корзину: ${line.product.name}, ${line.product.shade}, размер ${line.size}`"
                  @click="
                    cart.updateSelection(line.key, { removed: false, quantity: Math.max(1, line.quantity) })
                  "
                >
                  Вернуть
                </button>
              </li>
            </ul>
          </div>
        </template>

        <template v-else>
          <div v-if="favoritesIsEmpty" class="py-10 text-center sm:py-12">
            <p class="text-base font-semibold text-ink">В избранном пока пусто</p>
            <NuxtLink to="/catalog" class="shop-button-primary mt-5">В каталог</NuxtLink>
          </div>

          <CatalogGrid v-else :products="items" />
        </template>
      </div>

      <CartSummary v-if="showCartSummary" />
    </div>
  </section>
</template>
