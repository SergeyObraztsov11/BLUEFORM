<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowForwardW400 as ArrowForward } from '@material-symbols-svg/vue/sharp/icons/arrow-forward'
import { CloseW400 as Close } from '@material-symbols-svg/vue/sharp/icons/close'
import { FavoriteW400 as Favorite } from '@material-symbols-svg/vue/sharp/icons/favorite'
import { LogoutW400 as Logout } from '@material-symbols-svg/vue/sharp/icons/logout'
import { PersonW400 as Person } from '@material-symbols-svg/vue/sharp/icons/person'
import { ReceiptLongW400 as ReceiptLong } from '@material-symbols-svg/vue/sharp/icons/receipt-long'
import { SettingsW400 as Settings } from '@material-symbols-svg/vue/sharp/icons/settings'
import { ShoppingBagW400 as ShoppingBag } from '@material-symbols-svg/vue/sharp/icons/shopping-bag'
import { scrollToSection } from '~/composables/useSectionNavigation'
import { useAccountStore } from '~/stores/account'
import { useCartStore } from '~/stores/cart'
import { useFavoritesStore } from '~/stores/favorites'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: []; auth: [mode: 'login' | 'register'] }>()
const account = useAccountStore()
const cart = useCartStore()
const favorites = useFavoritesStore()
const route = useRoute()
const closeButton = ref<HTMLButtonElement | null>(null)
const leaving = ref(false)

const cartCount = computed(() => cart.activeLines.length)
const favoriteCount = computed(() => favorites.items.length)
const profile = computed(() => account.profile)
const accountName = computed(() => {
  const current = profile.value
  if (!current) return ''
  const name = [current.firstName, current.lastName].map(part => part.trim()).filter(Boolean).join(' ')
  return name || current.email
})
const accountInitials = computed(() => {
  const current = profile.value
  if (!current) return ''
  const parts = [current.firstName, current.lastName].map(part => part.trim()).filter(Boolean)
  if (parts.length) return parts.map(part => part.charAt(0)).join('').slice(0, 2).toLocaleUpperCase('ru-RU')
  return (current.email.trim().charAt(0) || '?').toLocaleUpperCase('ru-RU')
})

const shopLinks = [
  { label: 'Весь каталог', to: '/catalog' },
  { label: 'Женщинам', to: '/catalog?category=women' },
  { label: 'Мужчинам', to: '/catalog?category=men' },
  { label: 'Распродажа', to: '/catalog?sale=1', sale: true },
]

const accountLinks = computed(() => {
  const favoritesLink = { id: 'favorites', label: 'Избранное', icon: Favorite, to: '/favorites', count: favoriteCount.value }
  const cartLink = { id: 'cart', label: 'Корзина', icon: ShoppingBag, to: '/cart', count: cartCount.value }
  if (!profile.value) return [favoritesLink, cartLink]
  return [
    { id: 'profile', label: 'Профиль', icon: Person, to: '/profile' },
    { id: 'orders', label: 'Заказы', icon: ReceiptLong, to: '/orders' },
    favoritesLink,
    cartLink,
    { id: 'settings', label: 'Настройки', icon: Settings, to: '/settings' },
  ]
})

function isCurrentShopLink(to: string) {
  if (route.path !== '/catalog') return false
  if (to.includes('sale=1')) return route.query.sale === '1'
  if (route.query.sale === '1') return false
  if (to.includes('category=women')) return String(route.query.category ?? '').startsWith('women')
  if (to.includes('category=men')) return String(route.query.category ?? '').startsWith('men')
  return !route.query.category
}

const rowClass = 'flex min-h-[58px] w-full items-center justify-between gap-3 border-b border-seam px-1 text-left text-[17px] font-semibold leading-5 text-ink transition-colors hover:text-cobalt'

function openSection(hash: string) {
  emit('close')
  scrollToSection(hash)
}

async function signOut() {
  if (leaving.value) return
  leaving.value = true
  try {
    await account.signOut()
    emit('close')
  } finally {
    leaving.value = false
  }
}
</script>

<template>
  <UiModalShell
    :visible="visible"
    labelled-by="mobile-navigation-title"
    placement="right"
    panel-class="shop-modal flex h-dvh w-[min(400px,calc(100vw-28px))] flex-col bg-white lg:hidden"
    @close="emit('close')"
    @opened="closeButton?.focus({ preventScroll: true })"
  >
    <div class="flex shrink-0 items-start justify-between gap-4 bg-cobalt px-6 py-6 text-white">
      <div class="min-w-0">
        <p class="type-label text-white/80">BLUEFORM / МАГАЗИН</p>
        <div v-if="profile" class="mt-5 flex items-center gap-3.5">
          <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold tracking-[0.04em] text-cobalt" aria-hidden="true">{{ accountInitials }}</div>
          <div class="min-w-0">
            <h2 id="mobile-navigation-title" class="truncate text-[20px] font-bold leading-tight">{{ accountName }}</h2>
            <p v-if="accountName !== profile.email" class="mt-1 truncate text-sm text-white/75">{{ profile.email }}</p>
          </div>
        </div>
        <h2 v-else id="mobile-navigation-title" class="type-heading mt-3 text-[28px]">МЕНЮ</h2>
      </div>
      <button ref="closeButton" type="button" class="-mr-2 -mt-2 flex size-10 shrink-0 items-center justify-center text-white hover:bg-white/15" aria-label="Закрыть меню" @click="emit('close')">
        <Close :size="24" aria-hidden="true" />
      </button>
    </div>

    <nav id="mobile-navigation" class="min-h-0 flex-1 overscroll-contain overflow-y-auto px-6 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Мобильная навигация">
      <div class="pt-7">
        <p class="type-label mb-3 text-cobalt">АККАУНТ</p>
        <ul>
          <li v-if="!profile">
            <button type="button" :class="[rowClass, 'group py-3']" @click="emit('auth', 'login')">
              <span class="flex min-w-0 items-center gap-3">
                <Person :size="22" class="shrink-0" aria-hidden="true" />
                <span class="min-w-0 text-left">
                  <span class="block">Профиль</span>
                  <span class="mt-0.5 block text-[13px] font-medium leading-4 text-ink/55 group-hover:text-cobalt">Войти или зарегистрироваться</span>
                </span>
              </span>
              <ArrowForward :size="20" class="shrink-0" aria-hidden="true" />
            </button>
          </li>
          <li v-for="item in accountLinks" :key="item.id">
            <NuxtLink
              :to="item.to"
              :class="rowClass"
              :aria-current="route.path === item.to ? 'page' : undefined"
              :aria-label="item.count ? `${item.label}, ${item.count}` : undefined"
              @click="emit('close')"
            >
              <span class="flex min-w-0 items-center gap-3">
                <component :is="item.icon" :size="22" class="shrink-0" aria-hidden="true" />
                {{ item.label }}
              </span>
              <span class="flex items-center gap-3">
                <span v-if="item.count" class="text-sm font-semibold tabular-nums text-cobalt" aria-hidden="true">{{ item.count }}</span>
                <ArrowForward :size="20" class="shrink-0" aria-hidden="true" />
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div class="pt-9">
        <p class="type-label mb-3 text-cobalt">МАГАЗИН</p>
        <ul>
          <li v-for="link in shopLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="flex min-h-[58px] items-center justify-between gap-3 border-b px-1 text-[17px] font-semibold leading-5 transition-colors"
              :class="isCurrentShopLink(link.to) ? 'border-cobalt text-cobalt' : 'border-seam text-ink hover:text-cobalt'"
              :aria-current="isCurrentShopLink(link.to) ? 'page' : undefined"
              @click="emit('close')"
            >
              {{ link.label }}
              <ArrowForward :size="20" class="shrink-0" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div class="pt-9">
        <p class="type-label mb-3 text-cobalt">О BLUEFORM</p>
        <ul>
          <li>
            <a href="/#top" class="flex min-h-[52px] items-center justify-between gap-3 border-b border-seam px-1 text-[15px] font-medium text-ink transition-colors hover:text-cobalt" @click.prevent="openSection('#top')">
              Главная <ArrowForward :size="19" class="shrink-0" aria-hidden="true" />
            </a>
          </li>
          <li>
            <a href="/#denim-palette" class="flex min-h-[52px] items-center justify-between gap-3 border-b border-seam px-1 text-[15px] font-medium text-ink transition-colors hover:text-cobalt" @click.prevent="openSection('#denim-palette')">
              Палитра тканей <ArrowForward :size="19" class="shrink-0" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <div v-if="profile" class="shrink-0 border-t border-seam px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-1">
      <button
        type="button"
        class="flex min-h-12 w-full items-center gap-3 px-1 text-left text-[15px] font-medium text-ink/55 transition-colors hover:text-ink disabled:cursor-wait disabled:text-ink/30"
        :disabled="leaving"
        @click="signOut"
      >
        <Logout :size="22" class="shrink-0" aria-hidden="true" />
        Выйти
      </button>
    </div>
  </UiModalShell>
</template>
