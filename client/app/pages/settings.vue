<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CurrencyRubleW400 as CurrencyRuble } from '@material-symbols-svg/vue/sharp/icons/currency-ruble';
import { FavoriteW400 as Favorite } from '@material-symbols-svg/vue/sharp/icons/favorite';
import { LanguageW400 as Language } from '@material-symbols-svg/vue/sharp/icons/language';
import { LogoutW400 as Logout } from '@material-symbols-svg/vue/sharp/icons/logout';
import { NotificationsW400 as Notifications } from '@material-symbols-svg/vue/sharp/icons/notifications';
import { PersonW400 as Person } from '@material-symbols-svg/vue/sharp/icons/person';
import { ReceiptLongW400 as ReceiptLong } from '@material-symbols-svg/vue/sharp/icons/receipt-long';
import { useAccountStore } from '~/stores/account';
import { apiErrorMessage } from '~/utils/apiError';

definePageMeta({ middleware: 'account' });

const account = useAccountStore();
const leaving = ref(false);
const signOutError = ref('');

watch(
  () => account.isAuthenticated,
  (signedIn) => {
    if (!signedIn) navigateTo('/catalog', { replace: true });
  },
);

const accountName = computed(() => {
  const profile = account.profile;
  if (!profile) return '';
  return (
    [profile.firstName, profile.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ') || profile.email
  );
});

const accountInitials = computed(() => {
  const profile = account.profile;
  if (!profile) return '';
  const initials = [profile.firstName, profile.lastName]
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join('');
  return (initials || profile.email.charAt(0)).slice(0, 2).toLocaleUpperCase('ru-RU');
});

const accountLinks = [
  { to: '/profile', label: 'Профиль', icon: Person },
  { to: '/orders', label: 'Заказы', icon: ReceiptLong },
  { to: '/notifications', label: 'Уведомления', icon: Notifications },
  { to: '/favorites', label: 'Избранное', icon: Favorite },
] as const;

async function signOut() {
  if (leaving.value) return;
  leaving.value = true;
  signOutError.value = '';
  try {
    await account.signOut();
  } catch (reason) {
    signOutError.value = apiErrorMessage(reason);
  } finally {
    leaving.value = false;
  }
}

useHead({ title: 'Настройки — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-6 md:pt-8">
    <ShopPageHeader title="Настройки" />

    <div class="grid items-start gap-8 lg:max-w-[760px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
      <div class="min-w-0 space-y-8">
        <div v-if="account.profile" class="relative overflow-hidden border border-seam bg-ice p-5 sm:p-6">
          <span class="absolute inset-y-0 left-0 w-1 bg-cobalt" aria-hidden="true" />
          <p class="type-label text-cobalt">АККАУНТ</p>
          <div class="mt-4 flex min-w-0 items-center gap-4">
            <span
              class="flex size-12 shrink-0 items-center justify-center bg-cobalt text-base font-bold text-white"
              aria-hidden="true"
              >{{ accountInitials }}</span
            >
            <div class="min-w-0">
              <p
                class="text-base font-bold leading-5 text-ink"
                :class="accountName === account.profile.email ? 'break-anywhere' : 'truncate'"
              >
                {{ accountName }}
              </p>
              <p v-if="accountName !== account.profile.email" class="mt-1 break-anywhere text-xs text-ink/65">
                {{ account.profile.email }}
              </p>
            </div>
          </div>
        </div>

        <section aria-labelledby="site-params-title">
          <h2 id="site-params-title" class="text-lg font-bold tracking-tight text-ink">Параметры сайта</h2>
          <ul class="mt-4 border-t border-seam" aria-label="Параметры сайта">
            <li class="flex items-center gap-3 border-b border-seam py-3.5">
              <span
                class="flex size-10 shrink-0 items-center justify-center border border-cobalt/20 bg-ice text-cobalt"
                aria-hidden="true"
              >
                <Language :size="20" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-ink">Язык</p>
                <p class="mt-0.5 text-sm text-ink/70">Русский</p>
              </div>
            </li>
            <li class="flex items-center gap-3 border-b border-seam py-3.5">
              <span
                class="flex size-10 shrink-0 items-center justify-center border border-cobalt/20 bg-ice text-cobalt"
                aria-hidden="true"
              >
                <CurrencyRuble :size="20" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-ink">Валюта</p>
                <p class="mt-0.5 text-sm text-ink/70">₽ RUB</p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div class="min-w-0 space-y-8">
        <section aria-labelledby="cabinet-links-title">
          <h2 id="cabinet-links-title" class="text-lg font-bold tracking-tight text-ink">Кабинет</h2>
          <nav class="mt-4 border-t border-seam" aria-label="Кабинет">
            <NuxtLink
              v-for="link in accountLinks"
              :key="link.to"
              :to="link.to"
              class="flex min-h-12 items-center gap-3 border-b border-seam py-3.5 text-sm font-semibold text-ink transition-colors hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              <span
                class="flex size-10 shrink-0 items-center justify-center border border-cobalt/20 bg-ice text-cobalt"
                aria-hidden="true"
              >
                <component :is="link.icon" :size="20" />
              </span>
              {{ link.label }}
            </NuxtLink>
          </nav>
        </section>

        <section aria-labelledby="session-title">
          <div class="bg-ice p-5 sm:p-6">
            <h2 id="session-title" class="text-lg font-bold text-ink">Выйти из аккаунта</h2>
            <p class="mt-2 text-sm leading-6 text-ink/65">Завершите сессию на этом устройстве.</p>
            <p v-if="signOutError" class="mt-3 text-sm text-error" role="alert">{{ signOutError }}</p>
            <button
              type="button"
              class="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 border border-ink px-5 text-sm font-bold text-ink hover:border-cobalt hover:bg-cobalt hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-wait disabled:opacity-50 sm:w-auto"
              :disabled="leaving"
              :aria-busy="leaving"
              @click="signOut"
            >
              <Logout :size="19" aria-hidden="true" />
              {{ leaving ? 'ВЫХОДИМ…' : 'ВЫЙТИ' }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
