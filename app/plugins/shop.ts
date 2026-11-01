export default defineNuxtPlugin(async () => {
  const account = useAccountStore()
  const cart = useCartStore()
  const favorites = useFavoritesStore()

  if (import.meta.server) {
    await Promise.all([account.refresh(), cart.load(), favorites.load()])
    return
  }

  if (!account.profile) await account.refresh()
  if (account.isAuthenticated) await $fetch('/api/session/discard', { method: 'POST' })
  if (!cart.loaded) await cart.load()
  if (!favorites.loaded) await favorites.load()
})
