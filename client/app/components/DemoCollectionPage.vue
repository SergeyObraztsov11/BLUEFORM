<script setup lang="ts">
import { computed, ref } from 'vue';
import { FavoriteFillW400 as FavoriteFill } from '@material-symbols-svg/vue/sharp/icons/favorite';
import { fabrics, productCategoryName, productImage, productImageAlt } from '~/data/catalog';
import { useCartStore } from '~/stores/cart';
import { useFavoritesStore } from '~/stores/favorites';
import type { CollectionKind } from '~/types/collection';
import { apiErrorMessage } from '~/utils/apiError';

const props = defineProps<{ kind: CollectionKind }>();
const isCart = computed(() => props.kind === 'cart');
const cart = useCartStore();
const favorites = useFavoritesStore();
const items = computed(() => favorites.items);
const selectedShades = computed(() => [...new Set(items.value.map((item) => item.shade))]);
const shadeHex = (name: string) => fabrics.find((fabric) => fabric.name === name)?.hex ?? '#b8cee8';

const retrying = ref(false);
const bootError = ref<string | null>(null);

const storeLoaded = computed(() => (isCart.value ? cart.loaded : favorites.loaded));
const pageError = computed(() => bootError.value || (isCart.value ? cart.error : favorites.error));
const isLoading = computed(() => !storeLoaded.value && !bootError.value && !retrying.value);
const showAside = computed(
  () =>
    storeLoaded.value &&
    (isCart.value ? cart.lines.length > 0 || cart.removedLines.length > 0 : items.value.length > 0),
);
const cartIsEmpty = computed(() => isCart.value && storeLoaded.value && !cart.lines.length);
const favoritesIsEmpty = computed(() => !isCart.value && storeLoaded.value && !items.value.length);

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
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner
      :title="isCart ? 'КОРЗИНА' : 'ИЗБРАННОЕ'"
      :lead="
        isCart
          ? 'Проверьте размер и количество перед оформлением.'
          : 'Сохраняй понравившиеся вещи и возвращайся к выбору размера, когда будешь готов.'
      "
    />

    <div class="mt-8 border-t-2 border-ink pt-6 lg:mt-12">
      <p class="type-label text-cobalt">{{ isCart ? 'СОСТАВ' : 'ПОДБОРКА' }}</p>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {{ isCart ? 'Товары в корзине' : 'Избранные товары' }}
      </h2>
      <p class="mt-3 max-w-lg text-sm leading-6 text-ink/65">
        {{
          isCart
            ? 'Измените размер или количество — итоговая сумма обновится автоматически.'
            : 'Откройте карточку, чтобы выбрать размер и добавить вещь в корзину.'
        }}
      </p>
    </div>

    <div v-if="pageError" class="mt-8 max-w-[640px] border border-error/25 bg-ice/60 p-5 sm:p-6" role="alert">
      <p class="text-sm font-semibold text-error">Не удалось выполнить действие</p>
      <p class="mt-2 text-sm leading-6 text-ink/70">{{ pageError }}</p>
      <div class="mt-5 flex flex-wrap gap-3">
        <button type="button" class="shop-button-primary" :disabled="retrying" @click="retryLoad">
          {{ retrying ? 'ЗАГРУЗКА…' : 'ПОВТОРИТЬ' }}
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

    <div v-if="isLoading || retrying" class="mt-10" role="status" aria-live="polite">
      <p class="text-sm text-ink/60">{{ isCart ? 'Загружаем корзину…' : 'Загружаем избранное…' }}</p>
    </div>

    <div
      v-else-if="storeLoaded"
      class="mt-8 grid items-start gap-8 lg:mt-10 lg:gap-12"
      :class="showAside ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'lg:grid-cols-1'"
    >
      <div class="min-w-0">
        <template v-if="isCart">
          <div v-if="cart.lines.length" class="border-y border-seam" aria-label="Список товаров в корзине">
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

          <div
            v-else-if="cartIsEmpty"
            class="mx-auto w-full max-w-[480px] border-y border-seam py-14 text-center"
          >
            <p class="text-lg font-semibold text-ink">Корзина пуста</p>
            <p class="mt-2 text-sm leading-6 text-ink/60">
              Выберите вещь и размер в каталоге — она появится здесь.
            </p>
            <div class="mt-6 flex flex-wrap justify-center gap-3">
              <NuxtLink to="/catalog" class="shop-button-primary">ПЕРЕЙТИ В КАТАЛОГ</NuxtLink>
              <NuxtLink
                to="/favorites"
                class="inline-flex h-12 items-center px-5 text-sm font-bold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              >
                Избранное
              </NuxtLink>
            </div>
          </div>

          <div
            v-if="cart.removedLines.length"
            class="mt-6 border border-seam bg-ice/50 px-4 py-5 sm:px-5"
            aria-label="Удалённые товары"
          >
            <p class="type-label text-ink/55">УДАЛЕНО ИЗ КОРЗИНЫ</p>
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
          <div
            v-if="favoritesIsEmpty"
            class="mx-auto w-full max-w-[480px] border-y border-seam py-14 text-center"
          >
            <p class="text-lg font-semibold text-ink">В избранном нет товаров</p>
            <p class="mt-2 text-sm leading-6 text-ink/60">
              Отмечай понравившиеся товары сердцем, чтобы вернуться к ним позже.
            </p>
            <NuxtLink to="/catalog" class="shop-button-primary mt-6">ПОСМОТРЕТЬ КАТАЛОГ</NuxtLink>
          </div>

          <div v-else class="border-y border-seam" aria-label="Список избранного">
            <article
              v-for="item in items"
              :key="item.id"
              class="flex gap-3 border-b border-seam py-5 last:border-b-0 sm:gap-5 sm:py-6"
            >
              <NuxtLink
                :to="`/product/${item.id}`"
                class="block aspect-[3/4] w-24 shrink-0 bg-ice focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt sm:w-28"
                :aria-label="`Открыть товар: ${item.name}, ${item.shade}`"
                ><img
                  :src="productImage(item)"
                  :alt="productImageAlt(item)"
                  class="h-full w-full object-cover"
                  loading="lazy"
              /></NuxtLink>
              <div class="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="text-base font-semibold leading-6 text-ink">
                      <NuxtLink
                        :to="`/product/${item.id}`"
                        class="hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                        >{{ item.name }}</NuxtLink
                      >
                    </h3>
                    <button
                      type="button"
                      class="shop-favorite-button shop-favorite-button--small"
                      :aria-label="`Убрать из избранного: ${item.name}, ${item.shade}`"
                      :aria-pressed="true"
                      @click="favorites.toggleFavorite(item.id)"
                    >
                      <FavoriteFill :size="21" aria-hidden="true" />
                    </button>
                  </div>
                  <p class="mt-1 text-sm text-ink/60">{{ item.shade }} · {{ productCategoryName(item) }}</p>
                </div>
                <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                  <p class="text-base font-bold" :class="item.oldPrice ? 'text-sale' : 'text-ink'">
                    {{ item.price.toLocaleString('ru-RU') }} ₽
                    <del v-if="item.oldPrice" class="ml-2 text-sm font-normal text-ink/45"
                      >{{ item.oldPrice.toLocaleString('ru-RU') }} ₽</del
                    >
                  </p>
                  <NuxtLink
                    :to="`/product/${item.id}`"
                    class="text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                    >Выбрать размер →</NuxtLink
                  >
                </div>
              </div>
            </article>
          </div>
        </template>
      </div>

      <aside
        v-if="showAside"
        class="bg-ice p-6 sm:p-8 lg:sticky lg:top-28"
        :aria-label="isCart ? 'Сводка корзины' : 'Сводка избранного'"
      >
        <p class="type-label text-cobalt">{{ isCart ? 'ВАШ ЗАКАЗ' : 'ВАШ ВЫБОР' }}</p>
        <h2 class="mt-3 text-2xl font-bold leading-tight text-ink">
          {{ isCart ? 'Итог' : 'Оттенки' }}
        </h2>
        <div class="mt-7 border-t border-ink/15 pt-5">
          <template v-if="isCart">
            <div class="flex items-baseline justify-between gap-4 text-sm text-ink/75">
              <span>Товары · {{ cart.totalQuantity }} шт.</span>
              <span>{{ cart.total.toLocaleString('ru-RU') }} ₽</span>
            </div>
            <div
              class="mt-5 flex items-baseline justify-between gap-4 border-t border-ink/15 pt-5 text-lg font-bold text-ink"
            >
              <span>Итого</span>
              <span>{{ cart.total.toLocaleString('ru-RU') }} ₽</span>
            </div>
            <p class="mt-4 text-xs leading-5 text-ink/55">
              Сумма по доступным позициям. Условия доставки уточняются на оформлении.
            </p>
          </template>
          <template v-else>
            <ul v-if="selectedShades.length" class="space-y-4">
              <li
                v-for="shade in selectedShades"
                :key="shade"
                class="flex items-center gap-3 text-sm text-ink"
              >
                <span
                  class="size-8 shrink-0 border border-ink/10"
                  :style="{ backgroundColor: shadeHex(shade) }"
                  aria-hidden="true"
                />
                <span>{{ shade }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-ink/60">Понравившиеся оттенки появятся здесь.</p>
            <p class="mt-6 text-sm leading-6 text-ink/65">Откройте карточку товара, чтобы выбрать размер.</p>
          </template>
        </div>
        <p v-if="isCart && cart.hasStockIssues" class="mt-6 text-sm text-error" role="alert">
          Проверьте наличие и количество товаров в корзине перед оформлением.
        </p>
        <NuxtLink
          v-if="isCart && cart.totalQuantity > 0 && !cart.hasStockIssues"
          to="/checkout"
          class="shop-button-primary mt-7 w-full"
          >ПЕРЕЙТИ К ОФОРМЛЕНИЮ</NuxtLink
        >
        <button
          v-else-if="isCart"
          type="button"
          disabled
          class="shop-button-primary mt-7 w-full"
          :aria-label="
            cart.hasStockIssues
              ? 'Оформление недоступно: проверьте наличие и количество'
              : 'Оформление недоступно: корзина пуста'
          "
        >
          ПЕРЕЙТИ К ОФОРМЛЕНИЮ
        </button>
        <NuxtLink
          v-if="isCart"
          to="/catalog"
          class="mt-4 block text-center text-sm font-semibold text-cobalt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >Продолжить покупки</NuxtLink
        >
      </aside>
    </div>
  </section>
</template>
