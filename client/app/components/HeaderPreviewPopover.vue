<script setup lang="ts">
import { computed } from 'vue';
import { CloseW400 as Close } from '@material-symbols-svg/vue/sharp/icons/close';
import { useCartStore, cartLineInStock } from '~/stores/cart';
import { useFavoritesStore } from '~/stores/favorites';
import type { CollectionKind } from '~/types/collection';
import { productImage, productImageAlt } from '~/data/catalog';

const props = defineProps<{ kind: CollectionKind }>();
const emit = defineEmits<{ close: [] }>();

const cart = useCartStore();
const favorites = useFavoritesStore();
const items = computed(() =>
  props.kind === 'cart'
    ? cart.lines.map((line) => ({
        ...line.product,
        key: line.key,
        quantity: line.quantity,
        size: line.size,
        displayPrice: line.product.price * line.quantity,
        unavailable: !cartLineInStock(line.product, line.size),
      }))
    : favorites.items.map((item) => ({
        ...item,
        key: item.id,
        quantity: 1,
        size: '',
        displayPrice: item.price,
        unavailable: false,
      })),
);
const total = computed(() =>
  props.kind === 'cart' ? cart.total : items.value.reduce((sum, item) => sum + item.price, 0),
);
const isCart = computed(() => props.kind === 'cart');
const actionTo = computed(() => {
  if (!isCart.value) return '/favorites';
  return items.value.length ? '/cart' : '/catalog';
});
const actionLabel = computed(() => {
  if (!isCart.value) return 'ОТКРЫТЬ ИЗБРАННОЕ';
  return items.value.length ? 'ПЕРЕЙТИ В КОРЗИНУ' : 'ПЕРЕЙТИ В КАТАЛОГ';
});
</script>

<template>
  <section
    :aria-label="isCart ? 'Предпросмотр корзины' : 'Предпросмотр избранного'"
    class="flex max-h-[min(440px,calc(100dvh-136px))] min-h-0 flex-col"
  >
    <div class="flex shrink-0 items-start justify-between gap-3">
      <div>
        <p class="type-label text-cobalt">{{ isCart ? 'ВАША КОРЗИНА' : 'ИЗБРАННОЕ' }}</p>
        <p v-if="!isCart || items.length" class="mt-1 text-xs text-ink/55">
          {{ isCart ? `${cart.totalQuantity} шт. в корзине` : `${items.length} шт. в избранном` }}
        </p>
      </div>
      <button
        type="button"
        class="-mr-1 -mt-1 flex size-8 items-center justify-center text-ink/60 hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        aria-label="Закрыть список"
        @click="emit('close')"
      >
        <Close :size="20" aria-hidden="true" />
      </button>
    </div>

    <ul class="mt-4 min-h-0 overflow-y-auto overscroll-contain divide-y divide-seam border-y border-seam">
      <li v-for="item in items" :key="item.key" class="flex gap-3 py-3">
        <NuxtLink
          :to="`/product/${item.id}`"
          class="block h-[68px] w-14 shrink-0 bg-ice focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          :aria-label="`Открыть товар: ${item.name}, ${item.shade}`"
          @click="emit('close')"
          ><img
            :src="productImage(item)"
            :alt="productImageAlt(item)"
            class="h-full w-full object-cover"
            :class="item.unavailable ? 'grayscale opacity-55' : ''"
            loading="lazy"
        /></NuxtLink>
        <div class="min-w-0 flex-1">
          <p
            class="line-clamp-2 text-[13px] font-semibold leading-5"
            :class="item.unavailable ? 'text-ink/40' : 'text-ink'"
          >
            <NuxtLink
              :to="`/product/${item.id}`"
              class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              :class="item.unavailable ? '' : 'hover:text-cobalt'"
              @click="emit('close')"
              >{{ item.name }}</NuxtLink
            >
          </p>
          <p class="mt-0.5 text-xs" :class="item.unavailable ? 'text-ink/40' : 'text-ink/60'">
            {{ item.shade
            }}<template v-if="isCart && !item.unavailable">
              · размер {{ item.size }} · {{ item.quantity }} шт.</template
            ><template v-else-if="isCart"> · нет в наличии</template>
          </p>
          <p
            class="mt-1 text-sm font-bold"
            :class="item.unavailable ? 'text-ink/40' : item.oldPrice ? 'text-sale' : 'text-ink'"
          >
            {{ item.displayPrice.toLocaleString('ru-RU') }} ₽
          </p>
        </div>
      </li>
      <li v-if="!items.length" class="py-5 text-center text-sm text-ink/60">
        {{ isCart ? 'Корзина пуста' : 'В избранном нет товаров' }}
      </li>
    </ul>

    <div
      v-if="isCart && items.length"
      class="mt-4 flex shrink-0 items-baseline justify-between gap-4 text-sm font-semibold text-ink"
    >
      <span>Итого</span><span>{{ total.toLocaleString('ru-RU') }} ₽</span>
    </div>
    <NuxtLink :to="actionTo" class="shop-button-primary mt-4 w-full shrink-0" @click="emit('close')">{{
      actionLabel
    }}</NuxtLink>
  </section>
</template>
