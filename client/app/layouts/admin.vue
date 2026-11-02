<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAccountStore } from '~/stores/account';

const account = useAccountStore();
const route = useRoute();
const leaving = ref(false);
const signOutError = ref('');

const showNav = computed(() => account.isAdmin && route.path !== '/admin/login');
const ordersActive = computed(() => route.path.startsWith('/admin/orders'));

async function signOut() {
  if (leaving.value) return;
  leaving.value = true;
  signOutError.value = '';
  try {
    await account.signOut();
    await navigateTo('/admin/login');
  } catch (reason) {
    signOutError.value =
      reason instanceof Error ? reason.message : 'Не удалось выйти из аккаунта. Попробуйте ещё раз.';
  } finally {
    leaving.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-ice text-ink">
    <header class="border-b border-seam bg-white">
      <div class="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div class="min-w-0">
          <p class="type-label text-cobalt">BLUEFORM ADMIN</p>
          <p class="mt-1 text-sm font-semibold text-ink">Панель заказов</p>
        </div>
        <div v-if="showNav" class="flex flex-wrap items-center gap-3 sm:gap-4">
          <nav aria-label="Разделы админки" class="flex items-center gap-2">
            <NuxtLink
              to="/admin/orders"
              class="inline-flex min-h-10 items-center border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              :class="
                ordersActive
                  ? 'border-ink bg-ink text-white'
                  : 'border-seam text-ink hover:border-cobalt hover:text-cobalt'
              "
              :aria-current="ordersActive ? 'page' : undefined"
            >
              Заказы
            </NuxtLink>
          </nav>
          <span
            v-if="account.profile"
            class="hidden max-w-[220px] truncate text-sm text-ink/60 sm:inline"
            :title="account.profile.email"
          >
            {{ account.profile.email }}
          </span>
          <div class="flex flex-col items-end gap-1">
            <button
              type="button"
              class="inline-flex min-h-10 items-center px-2 text-sm font-semibold text-ink/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-wait disabled:opacity-40"
              :disabled="leaving"
              :aria-busy="leaving"
              @click="signOut"
            >
              {{ leaving ? 'Выходим…' : 'Выйти' }}
            </button>
            <p v-if="signOutError" class="max-w-[220px] text-right text-xs text-error" role="alert">
              {{ signOutError }}
            </p>
          </div>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <slot />
    </main>
  </div>
</template>
