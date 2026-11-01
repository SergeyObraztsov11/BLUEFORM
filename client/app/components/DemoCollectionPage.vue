<script setup lang="ts">
import { computed } from 'vue'
import { FavoriteFillW400 as FavoriteFill } from '@material-symbols-svg/vue/sharp/icons/favorite'
import { fabrics, productCategoryName, productImage, productImageAlt } from '~/data/catalog'
import { useCartStore } from '~/stores/cart'
import { useFavoritesStore } from '~/stores/favorites'
import type { CollectionKind } from '~/types/collection'

const props = defineProps<{ kind: CollectionKind }>()
const isCart = computed(() => props.kind === 'cart')
const cart = useCartStore()
const favorites = useFavoritesStore()
const items = computed(() => favorites.items)
const selectedShades = computed(() => [...new Set(items.value.map(item => item.shade))])
const shadeHex = (name: string) => fabrics.find(fabric => fabric.name === name)?.hex ?? '#b8cee8'
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner
      :title="isCart ? 'КОРЗИНА' : 'ИЗБРАННОЕ'"
      :lead="isCart ? 'Выбери нужный размер и количество для каждого товара.' : 'Сохраняй понравившиеся вещи и возвращайся к выбору размера, когда будешь готов.'"
    />
    <p v-if="cart.error || favorites.error" class="mt-4 text-sm text-error" role="alert">{{ cart.error || favorites.error }}</p>

    <div class="mt-10 grid items-start gap-8 lg:gap-12" :class="isCart || items.length ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'lg:grid-cols-1'">
      <div class="min-w-0 border-t border-seam">
        <template v-if="isCart">
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
          <div v-if="!cart.lines.length" class="py-12 text-center">
            <p class="text-lg font-semibold text-ink">Корзина пуста</p>
            <p class="mt-2 text-sm text-ink/60">Выбери вещь и нужный размер в каталоге.</p>
          </div>
          <div v-if="cart.removedLines.length" class="border-b border-seam py-6">
            <p class="text-xs font-bold tracking-[0.075em] text-ink/55">УДАЛЁНО ИЗ КОРЗИНЫ</p>
            <div v-for="line in cart.removedLines" :key="line.key" class="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/60">
              <span>{{ line.product.name }} · {{ line.product.shade }} · размер {{ line.size }}</span>
              <button type="button" class="font-semibold text-cobalt hover:text-ink" :aria-label="`Вернуть в корзину: ${line.product.name}, ${line.product.shade}, размер ${line.size}`" @click="cart.updateSelection(line.key, { removed: false, quantity: Math.max(1, line.quantity) })">Вернуть</button>
            </div>
          </div>
        </template>
        <div v-else-if="!items.length" class="mx-auto w-full max-w-[480px] py-14 text-center">
          <p class="text-lg font-semibold text-ink">В избранном нет товаров</p>
          <p class="mt-2 text-sm leading-6 text-ink/60">Отмечай понравившиеся товары сердцем, чтобы вернуться к ним позже.</p>
          <NuxtLink to="/catalog" class="shop-button-primary mt-6">ПОСМОТРЕТЬ КАТАЛОГ</NuxtLink>
        </div>
        <article v-for="item in isCart ? [] : items" :key="item.id" class="flex gap-4 border-b border-seam py-5 sm:gap-6">
          <NuxtLink :to="`/product/${item.id}`" class="block h-28 w-24 shrink-0 bg-ice sm:h-36 sm:w-28" :aria-label="`Открыть товар: ${item.name}, ${item.shade}`"><img :src="productImage(item)" :alt="productImageAlt(item)" class="h-full w-full object-cover" loading="lazy"></NuxtLink>
          <div class="flex min-w-0 flex-1 flex-col justify-between gap-3">
            <div>
              <div class="flex items-start justify-between gap-2">
                <h2 class="text-base font-semibold leading-6 text-ink"><NuxtLink :to="`/product/${item.id}`" class="hover:text-cobalt">{{ item.name }}</NuxtLink></h2>
                <button type="button" class="shop-favorite-button shop-favorite-button--small" :aria-label="`Убрать из избранного: ${item.name}, ${item.shade}`" :aria-pressed="true" @click="favorites.toggleFavorite(item.id)"><FavoriteFill :size="21" aria-hidden="true" /></button>
              </div>
              <p class="mt-1 text-sm text-ink/60">{{ item.shade }} · {{ productCategoryName(item) }}</p>
            </div>
            <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <p class="text-base font-bold" :class="item.oldPrice ? 'text-sale' : 'text-ink'">{{ item.price.toLocaleString('ru-RU') }} ₽ <del v-if="item.oldPrice" class="ml-2 text-sm font-normal text-ink/45">{{ item.oldPrice.toLocaleString('ru-RU') }} ₽</del></p>
              <NuxtLink :to="`/product/${item.id}`" class="text-sm font-semibold text-cobalt hover:text-ink">Выбрать размер →</NuxtLink>
            </div>
          </div>
        </article>
      </div>

      <aside v-if="isCart || items.length" class="bg-ice p-6 sm:p-8 lg:sticky lg:top-28" :aria-label="isCart ? 'Сводка корзины' : 'Сводка избранного'">
        <p class="type-label text-cobalt">{{ isCart ? 'ВАШ ЗАКАЗ' : 'ВАШ ВЫБОР' }}</p>
        <h2 class="mt-3 text-2xl font-bold leading-tight text-ink">{{ isCart ? 'Корзина' : 'Избранные оттенки' }}</h2>
        <div class="mt-7 border-t border-ink/15 pt-5">
          <template v-if="isCart">
            <div class="flex items-baseline justify-between gap-4 text-sm text-ink/75"><span>Товары · {{ cart.totalQuantity }} шт.</span><span>{{ cart.total.toLocaleString('ru-RU') }} ₽</span></div>
            <div class="mt-5 flex items-baseline justify-between gap-4 border-t border-ink/15 pt-5 text-lg font-bold text-ink"><span>Итого</span><span>{{ cart.total.toLocaleString('ru-RU') }} ₽</span></div>
          </template>
          <template v-else>
            <ul v-if="selectedShades.length" class="space-y-4">
              <li v-for="shade in selectedShades" :key="shade" class="flex items-center gap-3 text-sm text-ink">
                <span class="size-8 shrink-0 border border-ink/10" :style="{ backgroundColor: shadeHex(shade) }" aria-hidden="true" />
                <span>{{ shade }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-ink/60">Понравившиеся оттенки появятся здесь.</p>
            <p class="mt-6 text-sm leading-6 text-ink/65">Деним разных силуэтов и оттенков. Выбери вещь под свой ритм.</p>
          </template>
        </div>
        <p v-if="isCart && cart.hasStockIssues" class="mt-6 text-sm text-error" role="alert">Проверьте наличие и количество товаров в корзине перед оформлением.</p>
        <NuxtLink v-if="isCart && cart.totalQuantity > 0 && !cart.hasStockIssues" to="/checkout" class="shop-button-primary mt-7 w-full">ПЕРЕЙТИ К ОФОРМЛЕНИЮ</NuxtLink>
        <button v-else-if="isCart" type="button" disabled class="shop-button-primary mt-7 w-full">ПЕРЕЙТИ К ОФОРМЛЕНИЮ</button>
        <NuxtLink to="/catalog" class="mt-4 block text-center text-sm font-semibold text-cobalt hover:text-ink">{{ isCart ? 'Продолжить покупки' : 'Продолжить выбор' }}</NuxtLink>
      </aside>
    </div>
  </section>
</template>
