<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FavoriteW400 as Favorite } from '@material-symbols-svg/vue/sharp/icons/favorite';
import { MenuW400 as Menu } from '@material-symbols-svg/vue/sharp/icons/menu';
import { SearchW400 as Search } from '@material-symbols-svg/vue/sharp/icons/search';
import { ShoppingBagW400 as ShoppingBag } from '@material-symbols-svg/vue/sharp/icons/shopping-bag';
import { scrollToSection } from '~/composables/useSectionNavigation';
import { useAccountStore } from '~/stores/account';
import { useCartStore } from '~/stores/cart';
import { useFavoritesStore } from '~/stores/favorites';

const menuOpen = ref(false);
const authMode = ref<'login' | 'register' | null>(null);
const authVisible = ref(false);
const activePreview = ref<'favorites' | 'cart' | null>(null);
const accountMenuOpen = ref(false);
const dismissNotifications = ref(0);
const route = useRoute();
const account = useAccountStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const cartCount = computed(() => cart.activeLines.length);
const favoriteCount = computed(() => favorites.items.length);
const accountInitials = computed(() => {
  const profile = account.profile;
  if (!profile) return '';
  const parts = [profile.firstName, profile.lastName].map((part) => part.trim()).filter(Boolean);
  if (parts.length)
    return parts
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toLocaleUpperCase('ru-RU');
  return (profile.email.trim().charAt(0) || '?').toLocaleUpperCase('ru-RU');
});

const links = [
  { label: 'ГЛАВНАЯ', href: '#top' },
  { label: 'ЖЕНЩИНАМ', to: '/catalog?category=women' },
  { label: 'МУЖЧИНАМ', to: '/catalog?category=men' },
  { label: 'РАСПРОДАЖА', to: '/catalog?sale=1', sale: true },
  { label: 'ТКАНИ', href: '#denim-palette' },
];

function isCurrentCatalogLink(to: string) {
  if (route.path !== '/catalog') return false;
  if (to.includes('sale=1')) return route.query.sale === '1';
  if (route.query.sale === '1') return false;
  if (to.includes('category=women')) return String(route.query.category ?? '').startsWith('women');
  if (to.includes('category=men')) return String(route.query.category ?? '').startsWith('men');
  return false;
}

function closePanels() {
  menuOpen.value = false;
  activePreview.value = null;
  accountMenuOpen.value = false;
  dismissNotifications.value += 1;
}

function navigate(hash: string) {
  closePanels();
  scrollToSection(hash);
}

function openAuth(mode: 'login' | 'register') {
  closePanels();
  authMode.value = mode;
  authVisible.value = true;
}

function closeAuth() {
  authVisible.value = false;
}
function finishAuthClose() {
  if (!authVisible.value) authMode.value = null;
}

function onPreview(kind: 'favorites' | 'cart', next: boolean) {
  if (next) {
    menuOpen.value = false;
    accountMenuOpen.value = false;
    dismissNotifications.value += 1;
    activePreview.value = kind;
    return;
  }
  if (activePreview.value === kind) activePreview.value = null;
}

function onAccount(next: boolean) {
  if (next) {
    menuOpen.value = false;
    activePreview.value = null;
    dismissNotifications.value += 1;
  }
  accountMenuOpen.value = next;
}

function onNotificationsOpen() {
  menuOpen.value = false;
  activePreview.value = null;
  accountMenuOpen.value = false;
}

watch(() => route.fullPath, closePanels);
</script>

<template>
  <header class="sticky top-0 z-40 bg-white">
    <div class="flex h-16 items-center justify-between gap-3 md:h-[72px] lg:gap-5">
      <a
        href="/#top"
        class="type-brand shrink-0 text-[21px] text-cobalt sm:text-[23px]"
        aria-label="BLUEFORM — на главную"
        @click.prevent="navigate('#top')"
        >BLUEFORM</a
      >

      <nav class="hidden items-center gap-4 lg:flex 2xl:gap-6" aria-label="Основная навигация">
        <template v-for="link in links" :key="link.label">
          <a
            v-if="link.href"
            :href="`/${link.href}`"
            class="type-label py-3 text-ink transition-colors hover:text-cobalt"
            :aria-current="link.href === '#top' && route.path === '/' ? 'page' : undefined"
            @click.prevent="navigate(link.href)"
            >{{ link.label }}</a
          >
          <NuxtLink
            v-else-if="link.to"
            :to="link.to"
            class="type-label border-b-2 py-3 transition-colors hover:text-cobalt"
            :class="
              isCurrentCatalogLink(link.to) ? 'border-cobalt text-cobalt' : 'border-transparent text-ink'
            "
            :aria-current="isCurrentCatalogLink(link.to) ? 'page' : undefined"
            @click="closePanels"
            >{{ link.label }}</NuxtLink
          >
        </template>
      </nav>

      <div class="ml-auto hidden shrink-0 items-center gap-0.5 sm:gap-1 lg:flex">
        <NuxtLink
          to="/catalog"
          class="flex size-10 items-center justify-center text-ink transition-colors hover:text-cobalt"
          aria-label="Открыть каталог"
          title="Каталог"
          @click="closePanels"
          ><Search :size="24" aria-hidden="true"
        /></NuxtLink>
        <UiPopover
          :open="activePreview === 'favorites'"
          placement="bottom-end"
          panel-class="w-[min(350px,calc(100vw-32px))] p-4 sm:p-5"
          @update:open="onPreview('favorites', $event)"
        >
          <template #trigger="{ toggle, controls }">
            <button
              type="button"
              class="relative flex size-10 items-center justify-center text-ink transition-colors hover:text-cobalt"
              :aria-label="favoriteCount ? `Избранное, ${favoriteCount}` : 'Избранное'"
              title="Избранное"
              v-bind="controls"
              @click="toggle"
            >
              <Favorite :size="24" aria-hidden="true" />
              <span
                v-if="favoriteCount"
                class="pointer-events-none absolute bottom-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-cobalt px-1 text-[10px] font-bold leading-none text-white"
                aria-hidden="true"
                >{{ favoriteCount }}</span
              >
            </button>
          </template>
          <HeaderPreviewPopover kind="favorites" @close="onPreview('favorites', false)" />
        </UiPopover>
        <UiPopover
          :open="activePreview === 'cart'"
          placement="bottom-end"
          panel-class="w-[min(350px,calc(100vw-32px))] p-4 sm:p-5"
          @update:open="onPreview('cart', $event)"
        >
          <template #trigger="{ toggle, controls }">
            <button
              type="button"
              class="relative flex size-10 items-center justify-center text-ink transition-colors hover:text-cobalt"
              :aria-label="cartCount ? `Корзина, ${cartCount}` : 'Корзина'"
              title="Корзина"
              v-bind="controls"
              @click="toggle"
            >
              <ShoppingBag :size="24" aria-hidden="true" />
              <span
                v-if="cartCount"
                class="pointer-events-none absolute bottom-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-cobalt px-1 text-[10px] font-bold leading-none text-white"
                aria-hidden="true"
                >{{ cartCount }}</span
              >
            </button>
          </template>
          <HeaderPreviewPopover kind="cart" @close="onPreview('cart', false)" />
        </UiPopover>
        <HeaderNotifications
          v-if="account.isAuthenticated"
          :dismiss="dismissNotifications"
          @open="onNotificationsOpen"
        />

        <span class="mx-2 hidden h-5 w-px bg-seam lg:flex" aria-hidden="true" />
        <UiPopover
          v-if="account.isAuthenticated"
          :open="accountMenuOpen"
          placement="bottom-end"
          panel-class="w-56 py-2"
          @update:open="onAccount"
        >
          <template #trigger="{ toggle, controls }">
            <button
              type="button"
              class="flex size-10 items-center justify-center rounded-full bg-cobalt text-[11px] font-bold tracking-[0.04em] text-white transition-colors hover:bg-ink"
              aria-label="Меню аккаунта"
              title="Аккаунт"
              aria-haspopup="menu"
              v-bind="controls"
              @click="toggle"
            >
              {{ accountInitials }}
            </button>
          </template>
          <HeaderAccountMenu @close="onAccount(false)" />
        </UiPopover>
        <template v-else>
          <button
            type="button"
            class="type-label hidden px-2 py-3 text-ink transition-colors hover:text-cobalt lg:flex"
            @click="openAuth('login')"
          >
            ВОЙТИ
          </button>
          <button
            type="button"
            class="type-label ml-2 hidden bg-cobalt px-4 py-3 text-white transition-colors hover:bg-ink lg:flex"
            @click="openAuth('register')"
          >
            РЕГИСТРАЦИЯ
          </button>
        </template>
      </div>

      <HeaderNotifications
        v-if="account.isAuthenticated"
        :dismiss="dismissNotifications"
        root-class="ml-auto inline-flex lg:hidden"
        @open="onNotificationsOpen"
      />

      <button
        type="button"
        class="type-label flex items-center gap-1.5 py-3 text-cobalt lg:hidden"
        :class="account.isAuthenticated ? '' : 'ml-auto'"
        :aria-expanded="menuOpen"
        aria-controls="mobile-navigation"
        :aria-label="menuOpen ? 'Закрыть меню' : 'Открыть меню'"
        @click="
          menuOpen = !menuOpen;
          activePreview = null;
          accountMenuOpen = false;
          dismissNotifications += 1;
        "
      >
        <span>МЕНЮ</span>
        <Menu :size="23" aria-hidden="true" />
      </button>
    </div>

    <MobileNavigationDrawer :visible="menuOpen" @close="menuOpen = false" @auth="openAuth" />
    <MobileTabBar />

    <AuthModal
      v-if="authMode"
      :mode="authMode"
      :visible="authVisible"
      @close="closeAuth"
      @after-leave="finishAuthClose"
      @switch="authMode = $event"
      @success="closeAuth"
    />
  </header>
</template>
