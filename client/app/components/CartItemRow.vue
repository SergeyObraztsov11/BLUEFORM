<script setup lang="ts">
import { computed } from 'vue';
import { DeleteW400 as Delete } from '@material-symbols-svg/vue/sharp/icons/delete';
import {
  FavoriteW400 as Favorite,
  FavoriteFillW400 as FavoriteFill,
} from '@material-symbols-svg/vue/sharp/icons/favorite';
import { KeyboardArrowDownW400 as ArrowDown } from '@material-symbols-svg/vue/sharp/icons/keyboard-arrow-down';
import type { CatalogProduct } from '~/data/catalog';
import { productImage, productImageAlt } from '~/data/catalog';
import { cartLineInStock } from '~/stores/cart';

const MAX_LINE_QUANTITY = 99;

const props = defineProps<{ item: CatalogProduct; size: string; quantity: number; isFavorite: boolean }>();
const unavailable = computed(() => !cartLineInStock(props.item, props.size));
const muted = computed(() => unavailable.value);
const stockLeft = computed(() => props.item.sizes.find((size) => size.code === props.size)?.stock ?? 0);
const maxQuantity = computed(() => Math.max(0, Math.min(stockLeft.value, MAX_LINE_QUANTITY)));
const tooMany = computed(() => props.quantity > maxQuantity.value);
const atMaxQuantity = computed(() => !unavailable.value && props.quantity >= maxQuantity.value);
const canDecrease = computed(() => !unavailable.value && props.quantity > 1);
const canIncrease = computed(() => !unavailable.value && props.quantity < maxQuantity.value);
const canChangeSize = computed(() =>
  props.item.sizes.some((size) => size.stock > 0 && size.code !== props.size),
);
const emit = defineEmits<{
  'update:size': [value: string];
  'update:quantity': [value: number];
  'toggle:favorite': [];
  remove: [];
}>();

function setQuantity(next: number) {
  if (unavailable.value) return;
  const clamped = Math.min(Math.max(1, next), maxQuantity.value);
  if (clamped === props.quantity) return;
  emit('update:quantity', clamped);
}
</script>

<template>
  <article
    class="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 border-b border-seam py-5 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-x-5 sm:py-6"
    :class="muted ? 'bg-ice/70' : ''"
  >
    <NuxtLink
      :to="`/product/${item.id}`"
      class="block aspect-[3/4] w-full bg-ice focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt sm:row-span-2"
      :aria-label="`Открыть товар: ${item.name}, ${item.shade}`"
      ><img
        :src="productImage(item)"
        :alt="productImageAlt(item)"
        class="h-full w-full object-cover"
        :class="muted ? 'opacity-55 grayscale' : ''"
        loading="lazy"
    /></NuxtLink>
    <div class="flex min-w-0 flex-col gap-2">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h2 class="text-base font-semibold leading-6" :class="muted ? 'text-ink/40' : 'text-ink'">
            <NuxtLink
              :to="`/product/${item.id}`"
              class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              :class="muted ? '' : 'hover:text-cobalt'"
              >{{ item.name }}</NuxtLink
            >
          </h2>
          <p class="mt-1 text-sm leading-5" :class="muted ? 'text-ink/40' : 'text-ink/60'">
            {{ item.shade }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button
            type="button"
            class="shop-favorite-button shop-favorite-button--small"
            :aria-label="`${isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}: ${item.name}, ${item.shade}`"
            :aria-pressed="isFavorite"
            @click="emit('toggle:favorite')"
          >
            <FavoriteFill v-if="isFavorite" :size="21" aria-hidden="true" />
            <Favorite v-else :size="21" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex size-10 items-center justify-center border border-seam bg-white text-ink/60 transition-colors hover:border-error hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            :aria-label="`Удалить из корзины: ${item.name}, ${item.shade}`"
            @click="emit('remove')"
          >
            <Delete :size="21" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
        :aria-label="
          unavailable
            ? 'Нет в наличии, не входит в сумму заказа'
            : `Цена за ${quantity} шт.: ${(quantity * item.price).toLocaleString('ru-RU')} рублей`
        "
      >
        <strong
          class="text-xl font-bold leading-7"
          :class="muted ? 'text-ink/40' : item.oldPrice ? 'text-sale' : 'text-ink'"
          >{{ (item.price * quantity).toLocaleString('ru-RU') }} ₽</strong
        >
        <del v-if="item.oldPrice" class="text-sm leading-5" :class="muted ? 'text-ink/30' : 'text-ink/45'"
          >{{ (item.oldPrice * quantity).toLocaleString('ru-RU') }} ₽</del
        >
        <span v-if="quantity > 1 && !unavailable" class="text-xs leading-4 text-ink/55"
          >за {{ quantity }} шт.</span
        >
      </div>
      <p v-if="tooMany && !unavailable" class="text-xs font-semibold leading-4 text-error" role="alert">
        Доступно {{ maxQuantity }} шт. Уменьшите количество до {{ maxQuantity }}.
      </p>
      <p v-else-if="unavailable" class="text-xs font-semibold leading-4 text-error" role="status">
        Нет в наличии для выбранного размера
      </p>
    </div>
    <div class="col-span-2 flex flex-wrap items-end gap-3 sm:col-span-1 sm:col-start-2 sm:gap-4">
      <label class="flex flex-col gap-1 text-xs" :class="muted ? 'text-ink/40' : 'text-ink/60'">
        Размер
        <span class="relative block w-[76px]">
          <select
            :value="size"
            class="h-10 w-full appearance-none border border-seam bg-white pl-3 pr-7 text-sm font-semibold outline-none focus:border-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:text-ink/40"
            :class="muted ? 'text-ink/40' : 'text-ink'"
            :disabled="unavailable && !canChangeSize"
            :aria-label="`Размер: ${item.name}, ${item.shade}`"
            @change="emit('update:size', ($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="availableSize in item.sizes"
              :key="availableSize.code"
              :value="availableSize.code"
              :disabled="availableSize.stock < 1"
              :selected="availableSize.code === size"
            >
              {{ availableSize.code }}
            </option>
          </select>
          <ArrowDown
            :size="18"
            class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2"
            :class="muted ? 'text-ink/30' : 'text-ink'"
            aria-hidden="true"
          />
        </span>
      </label>
      <div class="flex flex-col gap-1 text-xs" :class="muted ? 'text-ink/40' : 'text-ink/60'">
        Количество
        <div
          v-if="unavailable"
          class="flex h-10 items-center whitespace-nowrap border border-seam bg-ice px-3 text-xs font-bold text-ink/45"
          role="status"
        >
          НЕТ В НАЛИЧИИ
        </div>
        <div
          v-else
          class="flex h-10 items-center border border-seam bg-white"
          role="group"
          :aria-label="`Количество: ${item.name}, ${item.shade}`"
        >
          <button
            type="button"
            class="flex size-10 items-center justify-center text-lg text-ink transition-colors hover:bg-ice focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:text-ink/25"
            :disabled="!canDecrease"
            :aria-label="`Уменьшить количество: ${item.name}, ${item.shade}`"
            @click="setQuantity(quantity - 1)"
          >
            −
          </button>
          <span class="w-8 text-center text-sm font-semibold text-ink" aria-live="polite">{{
            quantity
          }}</span>
          <button
            type="button"
            class="flex size-10 items-center justify-center text-lg text-cobalt transition-colors hover:bg-ice focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:text-ink/25"
            :disabled="!canIncrease"
            :aria-label="
              atMaxQuantity
                ? `Достигнут лимит ${maxQuantity} шт.: ${item.name}, ${item.shade}`
                : `Увеличить количество: ${item.name}, ${item.shade}`
            "
            @click="setQuantity(quantity + 1)"
          >
            +
          </button>
        </div>
      </div>
    </div>
  </article>
</template>
