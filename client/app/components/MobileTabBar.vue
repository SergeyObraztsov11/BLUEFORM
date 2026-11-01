<script setup lang="ts">
import { computed } from 'vue';
import { FavoriteW400 as Favorite } from '@material-symbols-svg/vue/sharp/icons/favorite';
import { PersonW400 as Person } from '@material-symbols-svg/vue/sharp/icons/person';
import { SearchW400 as Search } from '@material-symbols-svg/vue/sharp/icons/search';
import { ShoppingBagW400 as ShoppingBag } from '@material-symbols-svg/vue/sharp/icons/shopping-bag';
import { useCartStore } from '~/stores/cart';
import { useFavoritesStore } from '~/stores/favorites';

const route = useRoute();
const cart = useCartStore();
const favorites = useFavoritesStore();
const cartCount = computed(() => cart.activeLines.length);
const favoriteCount = computed(() => favorites.items.length);
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-seam bg-white shadow-[0_-8px_24px_rgba(16,43,78,0.06)] lg:hidden"
    aria-label="Разделы магазина"
  >
    <div class="mx-auto grid max-w-[1280px] grid-cols-4 pb-[env(safe-area-inset-bottom)]">
      <NuxtLink
        to="/catalog"
        class="relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-ink transition-colors hover:text-cobalt"
        :class="route.path === '/catalog' ? 'text-cobalt' : ''"
        :aria-current="route.path === '/catalog' ? 'page' : undefined"
      >
        <span
          v-if="route.path === '/catalog'"
          class="absolute inset-x-4 top-0 h-0.5 bg-cobalt"
          aria-hidden="true"
        />
        <Search :size="24" aria-hidden="true" />
        <span class="text-[11px] font-bold leading-none whitespace-nowrap tracking-[0.02em]">КАТАЛОГ</span>
      </NuxtLink>
      <NuxtLink
        to="/favorites"
        class="relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-ink transition-colors hover:text-cobalt"
        :class="route.path === '/favorites' ? 'text-cobalt' : ''"
        :aria-current="route.path === '/favorites' ? 'page' : undefined"
        :aria-label="favoriteCount ? `Избранное, ${favoriteCount}` : 'Избранное'"
      >
        <span
          v-if="route.path === '/favorites'"
          class="absolute inset-x-4 top-0 h-0.5 bg-cobalt"
          aria-hidden="true"
        />
        <span class="relative">
          <Favorite :size="24" aria-hidden="true" />
          <span
            v-if="favoriteCount"
            class="pointer-events-none absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-cobalt px-1 text-[10px] font-bold leading-none text-white"
            >{{ favoriteCount }}</span
          >
        </span>
        <span
          class="text-[11px] font-bold leading-none whitespace-nowrap tracking-[0.02em]"
          aria-hidden="true"
          >ИЗБРАННОЕ</span
        >
      </NuxtLink>
      <NuxtLink
        to="/cart"
        class="relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-ink transition-colors hover:text-cobalt"
        :class="route.path === '/cart' ? 'text-cobalt' : ''"
        :aria-current="route.path === '/cart' ? 'page' : undefined"
        :aria-label="cartCount ? `Корзина, ${cartCount}` : 'Корзина'"
      >
        <span
          v-if="route.path === '/cart'"
          class="absolute inset-x-4 top-0 h-0.5 bg-cobalt"
          aria-hidden="true"
        />
        <span class="relative">
          <ShoppingBag :size="24" aria-hidden="true" />
          <span
            v-if="cartCount"
            class="pointer-events-none absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-cobalt px-1 text-[10px] font-bold leading-none text-white"
            >{{ cartCount }}</span
          >
        </span>
        <span
          class="text-[11px] font-bold leading-none whitespace-nowrap tracking-[0.02em]"
          aria-hidden="true"
          >КОРЗИНА</span
        >
      </NuxtLink>
      <NuxtLink
        to="/profile"
        class="relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-ink transition-colors hover:text-cobalt"
        :class="route.path === '/profile' ? 'text-cobalt' : ''"
        :aria-current="route.path === '/profile' ? 'page' : undefined"
      >
        <span
          v-if="route.path === '/profile'"
          class="absolute inset-x-4 top-0 h-0.5 bg-cobalt"
          aria-hidden="true"
        />
        <Person :size="24" aria-hidden="true" />
        <span class="text-[11px] font-bold leading-none whitespace-nowrap tracking-[0.02em]">ПРОФИЛЬ</span>
      </NuxtLink>
    </div>
  </nav>
</template>
