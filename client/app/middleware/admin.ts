export default defineNuxtRouteMiddleware(async (to) => {
  const account = useAccountStore();
  if (!account.profile) await account.refresh();

  if (to.path === '/admin/login') {
    if (account.isAdmin) return navigateTo('/admin/orders', { replace: true });
    return;
  }

  if (!account.isAuthenticated) {
    return navigateTo({ path: '/admin/login', query: { next: to.fullPath } }, { replace: true });
  }
  if (!account.isAdmin) {
    return navigateTo('/admin/login?error=forbidden', { replace: true });
  }
});
