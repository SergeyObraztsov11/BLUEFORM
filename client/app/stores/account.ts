import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authClient } from '~/utils/authClient'
import { requestHeaders } from '~/utils/apiError'

export type AccountProfile = {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  phone: string
}

export const useAccountStore = defineStore('account', () => {
  const profile = ref<AccountProfile | null>(null)
  const isAuthenticated = computed(() => profile.value !== null)

  async function refresh() {
    const response = await $fetch<{ user: AccountProfile | null }>('/api/account', { headers: requestHeaders() })
    profile.value = response.user
  }

  async function signOut() {
    await authClient.signOut()
    profile.value = null
    const [{ useCartStore }, { useFavoritesStore }] = await Promise.all([
      import('~/stores/cart'),
      import('~/stores/favorites'),
    ])
    await Promise.all([useCartStore().load(), useFavoritesStore().load()])
  }

  return { profile, isAuthenticated, refresh, signOut }
})
