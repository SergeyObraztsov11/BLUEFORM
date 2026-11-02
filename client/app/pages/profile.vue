<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useAccountStore } from '~/stores/account';
import { apiErrorMessage } from '~/utils/apiError';

definePageMeta({ middleware: 'account' });
useHead({ title: 'Профиль — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });

const account = useAccountStore();
const form = reactive({ firstName: '', lastName: '', phone: '' });
const saving = ref(false);
const leaving = ref(false);
const error = ref('');
const signOutError = ref('');
const saved = ref(false);

watch(
  () => account.profile,
  (profile) => {
    if (profile)
      Object.assign(form, { firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone });
  },
  { immediate: true },
);

async function saveProfile() {
  if (saving.value) return;
  saving.value = true;
  error.value = '';
  saved.value = false;
  try {
    await $fetch('/api/account', { method: 'PATCH', body: { ...form } });
    await account.refresh();
    saved.value = true;
  } catch (reason) {
    error.value = apiErrorMessage(reason);
  } finally {
    saving.value = false;
  }
}

async function signOut() {
  if (leaving.value) return;
  leaving.value = true;
  signOutError.value = '';
  try {
    await account.signOut();
    await navigateTo('/catalog', { replace: true });
  } catch (reason) {
    signOutError.value =
      reason instanceof Error ? reason.message : 'Не удалось выйти из аккаунта. Попробуйте ещё раз.';
  } finally {
    leaving.value = false;
  }
}
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-6 md:pt-8">
    <ShopPageHeader title="Профиль">
      <template #actions>
        <div class="flex flex-col items-start gap-1 sm:items-end">
          <button
            type="button"
            class="inline-flex min-h-11 items-center text-sm font-medium text-ink/55 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-wait disabled:text-ink/30"
            :disabled="leaving"
            :aria-busy="leaving"
            @click="signOut"
          >
            {{ leaving ? 'Выходим…' : 'Выйти из аккаунта' }}
          </button>
          <p v-if="signOutError" class="max-w-[280px] text-sm text-error sm:text-right" role="alert">
            {{ signOutError }}
          </p>
        </div>
      </template>
    </ShopPageHeader>

    <div v-if="account.profile" class="grid border border-seam lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <div class="bg-ice/30 p-5 md:p-8">
        <h2 class="text-[20px] font-semibold text-ink">Личные данные</h2>
        <form class="mt-5 grid gap-5 sm:grid-cols-2" @input="saved = false" @submit.prevent="saveProfile">
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink">
            Имя
            <input
              v-model.trim="form.firstName"
              autocomplete="given-name"
              maxlength="80"
              class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
            />
          </label>
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink">
            Фамилия
            <input
              v-model.trim="form.lastName"
              autocomplete="family-name"
              maxlength="80"
              class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
            />
          </label>
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink">
            Телефон
            <input
              v-model.trim="form.phone"
              type="tel"
              autocomplete="tel"
              maxlength="32"
              placeholder="+7"
              class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
            />
          </label>
          <div class="flex flex-col gap-2 text-sm font-semibold text-ink">
            <span>Электронная почта</span>
            <p class="flex min-h-12 items-center break-all px-4 font-normal text-ink/70">
              {{ account.profile.email }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <p v-if="error" class="mb-4 text-sm text-error" role="alert">{{ error }}</p>
            <p v-if="saved" class="mb-4 text-sm text-cobalt" role="status">Данные сохранены.</p>
            <button type="submit" class="shop-button-primary w-full sm:w-auto" :disabled="saving">
              {{ saving ? 'Сохраняем…' : 'Сохранить изменения' }}
            </button>
          </div>
        </form>
      </div>

      <aside
        class="border-t border-seam bg-white p-5 md:p-8 lg:border-l lg:border-t-0"
        aria-label="Последний заказ"
      >
        <ProfileLatestOrder />
      </aside>
    </div>
  </section>
</template>
