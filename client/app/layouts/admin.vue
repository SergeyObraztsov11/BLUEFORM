<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAccountStore } from '~/stores/account';

const account = useAccountStore();
const route = useRoute();
const leaving = ref(false);

const showNav = computed(() => account.isAdmin && route.path !== '/admin/login');

async function signOut() {
  if (leaving.value) return;
  leaving.value = true;
  try {
    await account.signOut();
    await navigateTo('/admin/login');
  } finally {
    leaving.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-ice text-ink">
    <header class="border-b border-seam bg-white">
      <div class="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <p class="type-label text-cobalt">BLUEFORM / ADMIN</p>
          <p class="mt-1 text-sm font-semibold text-ink">Панель заказов</p>
        </div>
        <div v-if="showNav" class="flex items-center gap-4">
          <NuxtLink
            to="/admin/orders"
            class="text-sm font-semibold text-cobalt hover:text-ink"
            :aria-current="route.path.startsWith('/admin/orders') ? 'page' : undefined"
          >
            Заказы
          </NuxtLink>
          <span v-if="account.profile" class="hidden text-sm text-ink/60 sm:inline">{{
            account.profile.email
          }}</span>
          <button
            type="button"
            class="text-sm font-semibold text-ink/70 hover:text-ink disabled:opacity-40"
            :disabled="leaving"
            @click="signOut"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <slot />
    </main>
  </div>
</template>
