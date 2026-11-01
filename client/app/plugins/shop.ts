export default defineNuxtPlugin(async () => {
  const account = useAccountStore();
  const cart = useCartStore();
  const favorites = useFavoritesStore();
  const notifications = useNotificationsStore();

  if (import.meta.server) {
    await Promise.all([account.refresh(), cart.load(), favorites.load()]);
    if (account.isAuthenticated) await notifications.load();
    return;
  }

  if (!account.profile) await account.refresh();
  if (account.isAuthenticated) {
    const result = await $fetch<{ merged: boolean }>('/api/session/adopt', { method: 'POST' });
    if (result.merged) await Promise.all([cart.load(), favorites.load()]);
    await notifications.load();
  }
  if (!cart.loaded) await cart.load();
  if (!favorites.loaded) await favorites.load();
});
