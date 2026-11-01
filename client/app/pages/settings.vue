<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Component } from 'vue'
import { CampaignW400 as Campaign } from '@material-symbols-svg/vue/sharp/icons/campaign'
import { CreditCardW400 as CreditCard } from '@material-symbols-svg/vue/sharp/icons/credit-card'
import { CurrencyRubleW400 as CurrencyRuble } from '@material-symbols-svg/vue/sharp/icons/currency-ruble'
import { DevicesW400 as Devices } from '@material-symbols-svg/vue/sharp/icons/devices'
import { DownloadW400 as Download } from '@material-symbols-svg/vue/sharp/icons/download'
import { FavoriteW400 as Favorite } from '@material-symbols-svg/vue/sharp/icons/favorite'
import { LanguageW400 as Language } from '@material-symbols-svg/vue/sharp/icons/language'
import { LocationOnW400 as LocationOn } from '@material-symbols-svg/vue/sharp/icons/location-on'
import { LockW400 as Lock } from '@material-symbols-svg/vue/sharp/icons/lock'
import { LogoutW400 as Logout } from '@material-symbols-svg/vue/sharp/icons/logout'
import { MailW400 as Mail } from '@material-symbols-svg/vue/sharp/icons/mail'
import { NotificationsW400 as Notifications } from '@material-symbols-svg/vue/sharp/icons/notifications'
import { PersonRemoveW400 as PersonRemove } from '@material-symbols-svg/vue/sharp/icons/person-remove'
import { ShieldW400 as Shield } from '@material-symbols-svg/vue/sharp/icons/shield'
import { StraightenW400 as Straighten } from '@material-symbols-svg/vue/sharp/icons/straighten'
import { TuneW400 as Tune } from '@material-symbols-svg/vue/sharp/icons/tune'
import { useAccountStore } from '~/stores/account'

type SettingsItem = {
  id: string
  label: string
  detail?: string
  icon: Component
  value?: string
  available?: boolean
}

type SettingsSection = {
  id: string
  title: string
  items: SettingsItem[]
}

definePageMeta({ middleware: 'account' })

const account = useAccountStore()
const leaving = ref(false)
const route = useRoute()
const activeSection = ref(route.hash.slice(1) || 'security')

watch(() => route.hash, hash => {
  activeSection.value = hash.slice(1) || 'security'
})

watch(() => account.isAuthenticated, (signedIn) => {
  if (!signedIn) navigateTo('/catalog', { replace: true })
})

const accountName = computed(() => {
  const profile = account.profile
  if (!profile) return ''
  return [profile.firstName, profile.lastName].map(part => part.trim()).filter(Boolean).join(' ') || profile.email
})

const accountInitials = computed(() => {
  const profile = account.profile
  if (!profile) return ''
  const initials = [profile.firstName, profile.lastName].map(part => part.trim().charAt(0)).filter(Boolean).join('')
  return (initials || profile.email.charAt(0)).slice(0, 2).toLocaleUpperCase('ru-RU')
})

const sections = computed<SettingsSection[]>(() => [
  {
    id: 'security', title: 'Безопасность',
    items: [
      ...(account.profile ? [{ id: 'email', label: 'Почта для входа', icon: Mail, value: account.profile.email, available: true }] : []),
      { id: 'password', label: 'Смена пароля', icon: Lock },
      { id: 'sessions', label: 'Активные устройства', icon: Devices },
      { id: 'two-factor', label: 'Двухэтапная проверка', detail: 'Подтверждение входа кодом.', icon: Shield },
    ],
  },
  {
    id: 'shopping', title: 'Покупки',
    items: [
      { id: 'sizes', label: 'Мои размеры', detail: 'Размер будет подставляться в карточке товара.', icon: Straighten },
      { id: 'addresses', label: 'Адреса доставки', detail: 'Адрес по умолчанию для оформления заказа.', icon: LocationOn },
      { id: 'payment', label: 'Способы оплаты', detail: 'Быстрый выбор при оформлении заказа.', icon: CreditCard },
    ],
  },
  {
    id: 'notifications', title: 'Уведомления',
    items: [
      { id: 'orders', label: 'Статус заказа', detail: 'Письма об изменении статуса.', icon: Notifications },
      { id: 'new-items', label: 'Новинки BLUEFORM', detail: 'Новые модели и коллекции по почте.', icon: Campaign },
      { id: 'favorites', label: 'Избранные товары', detail: 'Когда цена снизится или размер вернётся в продажу.', icon: Favorite },
    ],
  },
  {
    id: 'interface', title: 'Интерфейс',
    items: [
      { id: 'language', label: 'Язык сайта', icon: Language, value: 'Русский' },
      { id: 'currency', label: 'Валюта', icon: CurrencyRuble, value: '₽ RUB' },
    ],
  },
  {
    id: 'privacy', title: 'Приватность',
    items: [
      { id: 'personalization', label: 'Персонализация', detail: 'Подборка моделей под ваши интересы.', icon: Tune },
      { id: 'export', label: 'Выгрузить данные', detail: 'Копия сведений и истории покупок.', icon: Download },
      { id: 'delete', label: 'Удалить аккаунт', detail: 'Удаление профиля и связанных данных.', icon: PersonRemove },
    ],
  },
])

async function signOut() {
  if (leaving.value) return
  leaving.value = true
  try {
    await account.signOut()
  } finally {
    leaving.value = false
  }
}

useHead({ title: 'Настройки — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner title="НАСТРОЙКИ" lead="Безопасность, покупки, уведомления и интерфейс." />

    <div v-if="account.profile" class="mt-8">
      <div class="relative overflow-hidden border border-seam bg-ice p-5 sm:max-w-[360px] sm:p-6">
        <span class="absolute inset-y-0 left-0 w-1 bg-cobalt" aria-hidden="true" />
        <p class="type-label text-cobalt">ВАШ АККАУНТ</p>
        <div class="mt-5 flex min-w-0 items-center gap-4">
          <span class="flex size-12 shrink-0 items-center justify-center bg-cobalt text-base font-bold text-white" aria-hidden="true">{{ accountInitials }}</span>
          <div class="min-w-0">
            <p class="truncate text-base font-bold leading-5 text-ink">{{ accountName }}</p>
            <p v-if="accountName !== account.profile.email" class="mt-1 truncate text-xs text-ink/65">{{ account.profile.email }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8 grid items-start gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10">
      <nav class="hidden min-w-0 lg:sticky lg:top-24 lg:block" aria-label="Разделы настроек">
        <h2 class="type-label mb-4 text-cobalt">РАЗДЕЛЫ</h2>
        <div>
          <a
            v-for="section in sections"
            :key="section.id"
            :href="`#${section.id}`"
            class="flex w-full border-b border-seam px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            :class="activeSection === section.id ? 'bg-ink text-white hover:text-white' : 'text-ink hover:text-cobalt'"
            :aria-current="activeSection === section.id ? 'location' : undefined"
            @click="activeSection = section.id"
          >
            {{ section.title }}
          </a>
        </div>
      </nav>

      <div class="min-w-0 space-y-10 md:space-y-12">
        <section v-for="section in sections" :id="section.id" :key="section.id" class="scroll-mt-28 border-t border-seam pt-5 sm:pt-6">
          <h2 class="text-[22px] font-bold leading-tight tracking-tight text-ink sm:text-[26px]">{{ section.title }}</h2>

          <ul class="mt-5 border-t border-seam">
            <li
              v-for="item in section.items"
              :key="item.id"
              class="grid grid-cols-[40px_minmax(0,1fr)] gap-3 border-b border-seam py-4 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:gap-4 sm:py-5"
            >
              <span class="flex size-10 items-center justify-center border sm:size-11" :class="item.available ? 'border-cobalt/20 bg-ice text-cobalt' : 'border-seam bg-[#f7f9fc] text-ink/50'" aria-hidden="true">
                <component :is="item.icon" :size="21" />
              </span>
              <div class="min-w-0">
                <h3 class="text-[15px] font-semibold leading-5 sm:text-base" :class="item.available ? 'text-ink' : 'text-ink/65'">{{ item.label }}</h3>
                <p v-if="item.detail" class="mt-1 text-[13px] leading-5" :class="item.available ? 'text-ink/65' : 'text-ink/55'">{{ item.detail }}</p>
                <p v-if="item.value" class="mt-1.5 break-all text-[13px] font-semibold leading-5" :class="item.available ? 'text-ink' : 'text-ink/60'">{{ item.value }}</p>
                <span class="mt-2 inline-flex bg-ink/5 px-2 py-1 text-[10px] font-bold tracking-[0.06em] text-ink/60 sm:hidden">{{ item.available ? 'УКАЗАНО' : 'СКОРО' }}</span>
              </div>
              <span class="hidden self-start whitespace-nowrap bg-ink/5 px-2.5 py-1.5 text-[10px] font-bold tracking-[0.06em] text-ink/60 sm:inline-flex">{{ item.available ? 'УКАЗАНО' : 'СКОРО' }}</span>
            </li>
          </ul>
        </section>

        <section class="border-t border-seam pt-5 sm:pt-6" aria-labelledby="session-title">
          <div class="flex flex-col gap-5 bg-ice p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
            <div>
              <h2 id="session-title" class="text-lg font-bold text-ink">Выйти из аккаунта</h2>
            </div>
            <button type="button" class="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 border border-ink px-5 text-sm font-bold text-ink hover:border-cobalt hover:bg-cobalt hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-wait disabled:opacity-50" :disabled="leaving" @click="signOut">
              <Logout :size="19" aria-hidden="true" />
              {{ leaving ? 'ВЫХОДИМ…' : 'ВЫЙТИ' }}
            </button>
          </div>
        </section>
      </div>
    </div>

  </section>
</template>
