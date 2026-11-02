<script setup lang="ts">
import { ref } from 'vue';
import { authClient } from '~/utils/authClient';
import { useAccountStore } from '~/stores/account';

definePageMeta({ layout: 'admin', middleware: 'admin' });
useHead({
  title: 'Вход администратора — BLUEFORM',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const account = useAccountStore();
const route = useRoute();
const email = ref('admin@blueform.local');
const password = ref('');
const error = ref<string | null>(null);
const submitting = ref(false);

if (route.query.error === 'forbidden') {
  error.value = 'Этот аккаунт не имеет прав администратора.';
}

async function submit() {
  if (submitting.value) return;
  error.value = null;
  submitting.value = true;
  try {
    const result = await authClient.signIn.email({
      email: email.value.trim(),
      password: password.value,
    });
    if (result.error) {
      error.value =
        result.error.code === 'INVALID_EMAIL_OR_PASSWORD'
          ? 'Неверная почта или пароль.'
          : result.error.code === 'EMAIL_NOT_VERIFIED'
            ? 'Сначала подтвердите почту.'
            : 'Не удалось войти. Проверьте данные.';
      return;
    }
    await account.refresh();
    if (!account.isAdmin) {
      try {
        await account.signOut();
      } catch (reason) {
        error.value =
          reason instanceof Error ? reason.message : 'Не удалось выйти из аккаунта. Попробуйте ещё раз.';
        return;
      }
      error.value = 'Этот аккаунт не имеет прав администратора.';
      return;
    }
    const next = typeof route.query.next === 'string' ? route.query.next : '/admin/orders';
    await navigateTo(next.startsWith('/admin') ? next : '/admin/orders');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <div class="border-t-2 border-ink pt-6">
      <p class="type-label text-cobalt">ДОСТУП ОГРАНИЧЕН</p>
      <h1 class="mt-3 text-3xl font-bold tracking-tight text-ink">Вход администратора</h1>
      <p class="mt-3 text-sm leading-6 text-ink/70">
        Отдельный вход в панель заказов. Обычный покупатель сюда попасть не может.
      </p>
    </div>

    <form
      class="mt-8 grid gap-5 border border-seam bg-white p-5 sm:p-6"
      :aria-busy="submitting"
      @submit.prevent="submit"
    >
      <label class="grid gap-2 text-sm font-semibold text-ink">
        Электронная почта
        <input
          v-model.trim="email"
          type="email"
          autocomplete="username"
          required
          class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
        />
      </label>
      <label class="grid gap-2 text-sm font-semibold text-ink">
        Пароль
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          minlength="8"
          class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
        />
      </label>

      <div v-if="error" class="border border-error/25 bg-ice/60 px-4 py-3 text-sm text-error" role="alert">
        {{ error }}
      </div>

      <button type="submit" class="shop-button-primary w-full" :disabled="submitting">
        {{ submitting ? 'ВХОДИМ…' : 'ВОЙТИ' }}
      </button>
    </form>
  </section>
</template>
