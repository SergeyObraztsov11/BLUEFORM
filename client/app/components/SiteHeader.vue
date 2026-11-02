<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
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
const accountMenuLabel = computed(() => {
  const profile = account.profile;
  if (!profile) return 'Меню аккаунта';
  const name = [profile.firstName, profile.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
  return name ? `Меню аккаунта, ${name}` : `Меню аккаунта, ${profile.email}`;
});

const navLinkClass =
  'px-1.5 py-3 text-[13px] font-semibold transition-colors hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt';

const links = [
  { label: 'Главная', href: '#top' },
  { label: 'Женщинам', to: '/catalog?category=women' },
  { label: 'Мужчинам', to: '/catalog?category=men' },
  { label: 'Распродажа', to: '/catalog?sale=1', sale: true },
] as const;

function isHomeCurrent() {
  return route.path === '/';
}

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

/** Matches Tailwind `xl` / desktop header. Listener cleanup via VueUse scope dispose. */
const isDesktopNav = useMediaQuery('(min-width: 1280px)');
watch(isDesktopNav, () => {
  closePanels();
});
</script>

<template>
  <header class="sticky top-0 z-40 bg-white">
    <div
      class="grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 md:h-[72px] xl:gap-5"
    >
      <a
        href="/#top"
        class="type-brand justify-self-start text-[21px] text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt sm:text-[23px]"
        aria-label="BLUEFORM — на главную"
        @click.prevent="navigate('#top')"
        >BLUEFORM</a
      >

      <nav class="hidden items-center gap-5 xl:flex" aria-label="Основная навигация">
        <template v-for="link in links" :key="link.label">
          <a
            v-if="'href' in link && link.href"
            :href="`/${link.href}`"
            :class="[navLinkClass, isHomeCurrent() ? 'text-cobalt' : 'text-ink']"
            :aria-current="isHomeCurrent() ? 'page' : undefined"
            @click.prevent="navigate(link.href)"
            >{{ link.label }}</a
          >
          <NuxtLink
            v-else-if="'to' in link && link.to"
            :to="link.to"
            :class="[navLinkClass, isCurrentCatalogLink(link.to) ? 'text-cobalt' : 'text-ink']"
            :aria-current="isCurrentCatalogLink(link.to) ? 'page' : undefined"
            @click="closePanels"
            >{{ link.label }}</NuxtLink
          >
        </template>
      </nav>

      <div class="hidden shrink-0 items-center justify-self-end gap-0.5 sm:gap-1 xl:flex">
        <NuxtLink
          to="/catalog"
          class="flex size-10 items-center justify-center text-ink transition-colors hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
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
              class="relative flex size-10 items-center justify-center text-ink transition-colors hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
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
              class="relative flex size-10 items-center justify-center text-ink transition-colors hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
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

        <span class="mx-2 hidden h-5 w-px bg-seam xl:flex" aria-hidden="true" />
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
              class="flex size-10 items-center justify-center rounded-full bg-cobalt text-[11px] font-bold tracking-[0.04em] text-white transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              :aria-label="accountMenuLabel"
              title="Аккаунт"
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
            class="hidden px-2 py-3 text-[13px] font-semibold text-ink transition-colors hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt xl:flex"
            @click="openAuth('login')"
          >
            Войти
          </button>
          <button
            type="button"
            class="ml-2 hidden bg-cobalt px-4 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt xl:flex"
            @click="openAuth('register')"
          >
            Регистрация
          </button>
        </template>
      </div>

      <div class="col-start-3 flex items-center justify-self-end gap-1 xl:hidden">
        <HeaderNotifications
          v-if="account.isAuthenticated"
          :dismiss="dismissNotifications"
          root-class="inline-flex"
          @open="onNotificationsOpen"
        />
        <button
          type="button"
          class="flex items-center gap-1.5 py-3 text-[13px] font-semibold text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
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
          <span>Меню</span>
          <Menu :size="23" aria-hidden="true" />
        </button>
      </div>
    </div>

    <MobileNavigationDrawer :visible="menuOpen" @close="menuOpen = false" @auth="openAuth" />
    <MobileTabBar @auth="openAuth" />

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
