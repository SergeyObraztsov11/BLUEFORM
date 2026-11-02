import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { authClient } from '~/utils/authClient';
import { requestHeaders } from '~/utils/apiError';

export type AccountProfile = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  firstName: string;
  lastName: string;
  phone: string;
};

export const useAccountStore = defineStore('account', () => {
  const profile = ref<AccountProfile | null>(null);
  const isAuthenticated = computed(() => profile.value !== null);
  const isAdmin = computed(() => profile.value?.role === 'admin');

  async function refresh() {
    const response = await $fetch<{ user: AccountProfile | null }>('/api/account', {
      headers: requestHeaders(),
    });
    profile.value = response.user;
  }

  async function signOut() {
    const result = await authClient.signOut();
    if (result.error) {
      throw new Error('Не удалось выйти из аккаунта. Попробуйте ещё раз.');
    }
    profile.value = null;
    const [{ useCartStore }, { useFavoritesStore }, { useNotificationsStore }] = await Promise.all([
      import('~/stores/cart'),
      import('~/stores/favorites'),
      import('~/stores/notifications'),
    ]);
    useNotificationsStore().clear();
    await Promise.all([useCartStore().load(), useFavoritesStore().load()]);
  }

  return { profile, isAuthenticated, isAdmin, refresh, signOut };
});
