<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FavoriteW400 as Favorite, FavoriteFillW400 as FavoriteFill } from '@material-symbols-svg/vue/sharp/icons/favorite'
import { AddW400 as Add } from '@material-symbols-svg/vue/sharp/icons/add'
import { fabrics, productImage, productImageAlt } from '~/data/catalog'
import type { CatalogProduct } from '~/data/catalog'
import { useCartStore } from '~/stores/cart'
import { useFavoritesStore } from '~/stores/favorites'

const props = defineProps<{ product: CatalogProduct }>()
const cart = useCartStore()
const favorites = useFavoritesStore()
const selectedSize = ref('')
const actionError = ref<string | null>(null)

watch(() => props.product.id, () => { selectedSize.value = '' })

const shadeHex = computed(() => fabrics.find(fabric => fabric.name === props.product.shade)?.hex)
const hasDiscount = computed(() => props.product.oldPrice != null && props.product.oldPrice > props.product.price)
const soldOut = computed(() => props.product.sizes.every(size => size.stock < 1))
const selectedQuantity = computed(() => cart.activeLines
  .filter(line => line.product.id === props.product.id && line.size === selectedSize.value)
  .reduce((sum, line) => sum + line.quantity, 0))
const quantityBySize = computed(() => Object.fromEntries(cart.activeLines
  .filter(line => line.product.id === props.product.id)
  .map(line => [line.size, line.quantity])))
const totalQuantity = computed(() => cart.activeLines
  .filter(line => line.product.id === props.product.id)
  .reduce((sum, line) => sum + line.quantity, 0))
const isFavorite = computed(() => favorites.isFavorite(props.product.id))

async function addToCart() {
  if (!selectedSize.value) return
  actionError.value = await cart.addItem(props.product.id, selectedSize.value)
}

async function onFavorite() {
  actionError.value = await favorites.toggleFavorite(props.product.id)
}
</script>

<template>
  <section class="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)] md:gap-10 lg:gap-16">
    <div class="relative h-[min(36svh,420px)] w-full overflow-hidden bg-[#f2f5f9] sm:aspect-[4/5] sm:h-auto sm:max-h-[620px] md:sticky md:top-24">
      <img :src="productImage(product)" :alt="productImageAlt(product)" class="h-full w-full" :class="[product.imageKind === 'fabric' || !product.image ? 'object-cover' : 'object-contain', soldOut ? 'grayscale opacity-55' : '']">
    </div>

    <div class="min-w-0 md:py-4">
      <h1 class="max-w-[570px] text-[clamp(1.85rem,3.3vw,3.45rem)] font-extrabold uppercase leading-[1.03] tracking-[-0.025em]" :class="soldOut ? 'text-ink/40' : 'text-ink'">{{ product.name }}</h1>

      <div class="mt-2 flex items-center gap-3 text-sm md:mt-5" :class="soldOut ? 'text-ink/35' : 'text-ink/75'">
        <span v-if="shadeHex" class="size-6 shrink-0 border border-ink/10" :class="soldOut ? 'opacity-45' : ''" :style="{ backgroundColor: shadeHex }" aria-hidden="true" />
        <span>{{ product.shade }}</span>
      </div>

      <div class="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-seam pt-4 md:mt-8 md:pt-6">
        <strong class="text-[1.75rem] font-bold leading-none md:text-3xl" :class="soldOut ? 'text-ink/40' : hasDiscount ? 'text-sale' : 'text-ink'">{{ product.price.toLocaleString('ru-RU') }} ₽</strong>
        <del v-if="hasDiscount" class="text-base text-ink/45">{{ product.oldPrice?.toLocaleString('ru-RU') }} ₽</del>
      </div>

      <div class="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 md:mt-9">
        <p id="product-size-label" class="text-sm font-semibold text-ink">Выбери размер</p>
        <span v-if="totalQuantity" class="flex items-center gap-1.5 text-xs text-ink/60"><span class="size-2.5 rounded-full bg-cobalt" aria-hidden="true" />Размер в корзине</span>
      </div>
      <div class="mt-3 flex flex-wrap gap-2.5" role="group" aria-labelledby="product-size-label">
        <button v-for="size in product.sizes" :key="size.code" type="button" class="relative flex h-12 min-w-12 items-center justify-center border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:border-seam disabled:bg-[#f2f4f6] disabled:text-ink/35" :class="selectedSize === size.code ? 'border-cobalt bg-cobalt text-white' : quantityBySize[size.code] ? 'border-2 border-cobalt bg-ice/60 text-cobalt' : 'border-seam bg-white text-ink hover:border-cobalt hover:text-cobalt'" :aria-label="size.stock < 1 ? `Размер ${size.code}, нет в наличии` : quantityBySize[size.code] ? `Размер ${size.code}, в корзине ${quantityBySize[size.code]} шт.` : `Размер ${size.code}, в наличии ${size.stock} шт.`" :aria-pressed="selectedSize === size.code" :disabled="size.stock < 1" @click="selectedSize = size.code">
          {{ size.code }}
          <span v-if="quantityBySize[size.code]" class="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border border-white bg-cobalt text-[10px] font-bold text-white" aria-hidden="true">{{ quantityBySize[size.code] }}</span>
        </button>
      </div>

      <div class="mt-6 flex flex-wrap gap-3 md:mt-7">
        <button v-if="soldOut" type="button" disabled class="min-h-12 min-w-[220px] flex-1 cursor-not-allowed border border-seam bg-[#f2f4f6] text-sm font-bold text-ink/45">НЕТ В НАЛИЧИИ</button>
        <button v-else type="button" class="shop-button-primary min-w-[220px] flex-1" :disabled="!selectedSize" @click="addToCart"><Add :size="21" aria-hidden="true" />{{ selectedQuantity ? 'ДОБАВИТЬ ЕЩЁ' : 'ДОБАВИТЬ В КОРЗИНУ' }}</button>
        <button type="button" class="shop-favorite-button" :aria-label="isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'" :aria-pressed="isFavorite" @click="onFavorite"><FavoriteFill v-if="isFavorite" :size="23" aria-hidden="true" /><Favorite v-else :size="23" aria-hidden="true" /></button>
      </div>
      <p v-if="actionError" class="mt-3 text-sm text-error" role="alert">{{ actionError }}</p>
      <NuxtLink v-if="totalQuantity" to="/cart" class="mt-3 inline-block text-sm font-semibold text-cobalt hover:text-ink">Перейти в корзину →</NuxtLink>

      <ProductInformation :product="product" />
    </div>
  </section>
</template>
