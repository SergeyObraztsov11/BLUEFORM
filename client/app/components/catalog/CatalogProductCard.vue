<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  FavoriteW400 as Favorite,
  FavoriteFillW400 as FavoriteFill,
} from '@material-symbols-svg/vue/sharp/icons/favorite';
import { AddW400 as Add } from '@material-symbols-svg/vue/sharp/icons/add';
import { RemoveW400 as Remove } from '@material-symbols-svg/vue/sharp/icons/remove';
import { fabrics, productImage, productImageAlt } from '~/data/catalog';
import type { CatalogProduct } from '~/data/catalog';
import { useCartStore } from '~/stores/cart';
import { useFavoritesStore } from '~/stores/favorites';
import CatalogSizeDialog from './CatalogSizeDialog.vue';

const props = defineProps<{ product?: CatalogProduct }>();
const cart = useCartStore();
const favorites = useFavoritesStore();
const isFavorite = computed(() => (props.product ? favorites.isFavorite(props.product.id) : false));
const cartSizes = computed(() =>
  props.product
    ? cart.activeLines
        .filter((line) => line.product.id === props.product?.id)
        .map((line) => ({ key: line.key, size: line.size, quantity: line.quantity }))
    : [],
);
const cartQuantity = computed(() => cartSizes.value.reduce((sum, line) => sum + line.quantity, 0));
const decreasableSizes = computed(() => cartSizes.value.filter((line) => line.quantity > 1));
const modalMode = ref<'add' | 'decrease' | null>(null);
const modalVisible = ref(false);
const actionError = ref<string | null>(null);

function openSizeDialog(mode: 'add' | 'decrease') {
  modalMode.value = mode;
  modalVisible.value = true;
}
function closeSizeDialog() {
  modalVisible.value = false;
}
function finishSizeDialogClose() {
  if (!modalVisible.value) modalMode.value = null;
}

function decreaseQuantity() {
  if (decreasableSizes.value.length === 1) {
    const line = decreasableSizes.value[0];
    if (line) cart.updateSelection(line.key, { quantity: line.quantity - 1 });
  } else if (decreasableSizes.value.length > 1) {
    openSizeDialog('decrease');
  }
}

async function confirmSize(size: string) {
  if (!props.product) return;
  if (modalMode.value === 'add') actionError.value = await cart.addItem(props.product.id, size);
  if (modalMode.value === 'decrease') {
    const line = cartSizes.value.find((item) => item.size === size);
    if (line && line.quantity > 1)
      actionError.value = await cart.updateSelection(line.key, { quantity: line.quantity - 1 });
  }
  closeSizeDialog();
}

async function onFavorite() {
  if (!props.product) return;
  actionError.value = await favorites.toggleFavorite(props.product.id);
}

const shadeHex = computed(() => fabrics.find((fabric) => fabric.name === props.product?.shade)?.hex);
const formattedPrice = computed(() => props.product?.price.toLocaleString('ru-RU'));
const hasDiscount = computed(
  () => props.product?.oldPrice != null && props.product.oldPrice > props.product.price,
);
const soldOut = computed(() => Boolean(props.product && props.product.sizes.every((size) => size.stock < 1)));
const formattedOldPrice = computed(() => props.product?.oldPrice?.toLocaleString('ru-RU'));
const discountPercent = computed(() => {
  const product = props.product;
  if (!product?.oldPrice || product.oldPrice <= product.price) return null;
  return Math.max(1, Math.round((1 - product.price / product.oldPrice) * 100));
});
</script>

<template>
  <article class="flex h-full min-w-0 flex-col" :aria-label="product ? undefined : 'Пустая карточка товара'">
    <div class="relative aspect-[4/5] w-full overflow-hidden bg-[#f2f5f9]">
      <NuxtLink
        v-if="product"
        :to="`/product/${product.id}`"
        class="group block h-full w-full"
        :aria-label="`Открыть товар: ${product.name}, ${product.shade}`"
      >
        <img
          :src="productImage(product)"
          :alt="productImageAlt(product)"
          class="h-full w-full motion-safe:transition-transform motion-safe:duration-500"
          :class="[
            product.imageKind === 'fabric' || !product.image ? 'object-cover' : 'object-contain',
            soldOut ? 'grayscale opacity-55' : 'motion-safe:group-hover:scale-[1.025]',
          ]"
          loading="lazy"
        />
      </NuxtLink>
      <button
        v-if="product"
        type="button"
        class="shop-favorite-button shop-favorite-button--small absolute right-2 top-2 z-10"
        :aria-label="`${isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}: ${product.name}, ${product.shade}`"
        :aria-pressed="isFavorite"
        @click="onFavorite"
      >
        <FavoriteFill v-if="isFavorite" :size="20" aria-hidden="true" />
        <Favorite v-else :size="20" aria-hidden="true" />
      </button>
      <span
        v-if="discountPercent && !soldOut"
        class="absolute bottom-2 left-2 bg-sale px-2 py-1 text-xs font-bold text-white"
        >−{{ discountPercent }}%</span
      >
    </div>

    <div v-if="product" class="mt-2.5 flex min-w-0 flex-1 flex-col gap-2.5">
      <h3 class="min-w-0 text-sm font-semibold leading-5" :class="soldOut ? 'text-ink/40' : 'text-ink'">
        <NuxtLink
          :to="`/product/${product.id}`"
          class="block truncate"
          :class="soldOut ? '' : 'hover:text-cobalt'"
          >{{ product.name }}</NuxtLink
        >
      </h3>
      <p
        class="flex items-baseline gap-2 whitespace-nowrap text-base font-bold leading-6"
        :class="soldOut ? 'text-ink/40' : hasDiscount ? 'text-sale' : 'text-ink'"
      >
        {{ formattedPrice }} ₽
        <del v-if="hasDiscount" class="text-sm font-normal" :class="soldOut ? 'text-ink/30' : 'text-ink/45'"
          >{{ formattedOldPrice }} ₽</del
        >
      </p>
      <p
        class="flex min-w-0 items-center gap-2 text-xs leading-5"
        :class="soldOut ? 'text-ink/35' : 'text-ink/65'"
      >
        <span
          v-if="shadeHex"
          class="size-3.5 shrink-0 border border-ink/10"
          :class="soldOut ? 'opacity-45' : ''"
          :style="{ backgroundColor: shadeHex }"
          aria-hidden="true"
        />
        <span class="truncate">{{ product.shade }}</span>
      </p>
      <p
        class="flex flex-nowrap gap-1.5 overflow-hidden text-xs font-semibold leading-5"
        :class="soldOut ? 'text-ink/35' : 'text-ink/80'"
        :aria-label="
          soldOut
            ? 'Нет в наличии'
            : `Доступные размеры: ${product.sizes.map((size) => size.code).join(', ')}`
        "
      >
        <span v-for="size in product.sizes" :key="size.code">{{ size.code }}</span>
      </p>
      <button
        v-if="soldOut"
        type="button"
        disabled
        class="mt-auto h-12 w-full cursor-not-allowed border border-seam bg-[#f2f4f6] text-xs font-bold text-ink/45"
      >
        НЕТ В НАЛИЧИИ
      </button>
      <button
        v-else-if="!cartQuantity"
        type="button"
        class="shop-button-primary mt-auto h-12 w-full gap-1 px-1.5 py-0 text-xs sm:gap-2 sm:px-3"
        :aria-label="`Выбрать размер и добавить в корзину: ${product.name}, ${product.shade}`"
        @click="openSizeDialog('add')"
      >
        <Add :size="18" class="shrink-0" aria-hidden="true" />
        <span class="sm:hidden">В КОРЗИНУ</span><span class="hidden sm:inline">ДОБАВИТЬ В КОРЗИНУ</span>
      </button>
      <div
        v-else
        class="mt-auto grid h-12 w-full grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] border border-cobalt text-cobalt"
      >
        <button
          type="button"
          class="flex items-center justify-center border-r border-cobalt/25 transition-colors hover:bg-cobalt hover:text-white disabled:cursor-not-allowed disabled:text-cobalt/30 disabled:hover:bg-transparent"
          :disabled="!decreasableSizes.length"
          :aria-label="`Уменьшить количество: ${product.name}, ${product.shade}`"
          @click="decreaseQuantity"
        >
          <Remove :size="18" aria-hidden="true" />
        </button>
        <span class="flex min-w-0 items-center justify-center px-1 text-center text-xs font-bold"
          >В КОРЗИНЕ · {{ cartQuantity }} ШТ.</span
        >
        <button
          type="button"
          class="flex items-center justify-center border-l border-cobalt/25 transition-colors hover:bg-cobalt hover:text-white"
          :aria-label="`Выбрать размер и увеличить количество: ${product.name}, ${product.shade}`"
          @click="openSizeDialog('add')"
        >
          <Add :size="18" aria-hidden="true" />
        </button>
      </div>
      <p v-if="actionError" class="text-xs text-error" role="alert">{{ actionError }}</p>
      <CatalogSizeDialog
        v-if="modalMode"
        :product="product"
        :mode="modalMode"
        :cart-sizes="cartSizes"
        :visible="modalVisible"
        @close="closeSizeDialog"
        @after-leave="finishSizeDialogClose"
        @confirm="confirmSize"
      />
    </div>

    <div v-else class="mt-2.5 flex flex-col gap-2.5" aria-hidden="true">
      <div class="h-4 w-3/4 bg-seam/65" />
      <div class="h-5 w-1/3 bg-seam/65" />
      <div class="h-3.5 w-1/2 bg-seam/45" />
      <div class="h-3.5 w-2/3 bg-seam/45" />
    </div>
  </article>
</template>
