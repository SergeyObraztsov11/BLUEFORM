<script setup lang="ts">
import { computed, ref } from 'vue';
import { FavoriteW400 as Favorite } from '@material-symbols-svg/vue/sharp/icons/favorite';
import { LogoutW400 as Logout } from '@material-symbols-svg/vue/sharp/icons/logout';
import { NotificationsW400 as Notifications } from '@material-symbols-svg/vue/sharp/icons/notifications';
import { PersonW400 as Person } from '@material-symbols-svg/vue/sharp/icons/person';
import { ReceiptLongW400 as ReceiptLong } from '@material-symbols-svg/vue/sharp/icons/receipt-long';
import { SettingsW400 as Settings } from '@material-symbols-svg/vue/sharp/icons/settings';
import { ShoppingBagW400 as ShoppingBag } from '@material-symbols-svg/vue/sharp/icons/shopping-bag';
import { useAccountStore } from '~/stores/account';

const emit = defineEmits<{ close: [] }>();
const account = useAccountStore();
const route = useRoute();
const leaving = ref(false);

const items = [
  { id: 'profile', label: 'Профиль', icon: Person, to: '/profile' },
  { id: 'orders', label: 'Заказы', icon: ReceiptLong, to: '/orders' },
  { id: 'notifications', label: 'Уведомления', icon: Notifications, to: '/notifications' },
  { id: 'favorites', label: 'Избранное', icon: Favorite, to: '/favorites' },
  { id: 'cart', label: 'Корзина', icon: ShoppingBag, to: '/cart' },
  { id: 'settings', label: 'Настройки', icon: Settings, to: '/settings' },
];

const profile = computed(() => account.profile);
const accountName = computed(() => {
  const current = profile.value;
  if (!current) return '';
  const name = [current.firstName, current.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
  return name || current.email;
});

async function signOut() {
  if (leaving.value) return;
  leaving.value = true;
  try {
    await account.signOut();
    emit('close');
  } finally {
    leaving.value = false;
  }
}
</script>

<template>
  <div role="menu" aria-label="Меню аккаунта">
    <div v-if="profile" class="border-b border-seam px-4 py-3">
      <p class="truncate text-sm font-semibold text-ink">{{ accountName }}</p>
      <p v-if="accountName !== profile.email" class="mt-0.5 truncate text-xs text-ink/55">
        {{ profile.email }}
      </p>
    </div>
    <NuxtLink
      v-for="item in items"
      :key="item.id"
      :to="item.to"
      role="menuitem"
      class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-ice hover:text-cobalt"
      :aria-current="route.path === item.to ? 'page' : undefined"
      @click="emit('close')"
    >
      <component :is="item.icon" :size="20" class="shrink-0" aria-hidden="true" />
      {{ item.label }}
    </NuxtLink>
    <div class="mt-1 border-t border-seam pt-1">
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-ice hover:text-cobalt disabled:cursor-wait disabled:text-ink/40"
        :disabled="leaving"
        @click="signOut"
      >
        <Logout :size="20" class="shrink-0" aria-hidden="true" />
        Выйти
      </button>
    </div>
  </div>
</template>
