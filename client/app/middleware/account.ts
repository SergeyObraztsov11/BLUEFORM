export default defineNuxtRouteMiddleware(async () => {
  const account = useAccountStore()
  if (!account.profile) await account.refresh()
  if (!account.isAuthenticated) return navigateTo('/catalog', { replace: true })
})