<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useAccountStore } from '~/stores/account';
import { apiErrorMessage } from '~/utils/apiError';

definePageMeta({ middleware: 'account' });
useHead({ title: 'Профиль — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });

const account = useAccountStore();
const form = reactive({ firstName: '', lastName: '', phone: '' });
const saving = ref(false);
const error = ref('');
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
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner title="МОЙ ПРОФИЛЬ" lead="Личные данные и всё важное о ваших покупках в BLUEFORM." />

    <div class="mt-8 grid items-start gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
      <div class="min-w-0">
        <div class="border-t-2 border-ink pt-6">
          <p class="type-label text-cobalt">ВАШИ ДАННЫЕ</p>
          <h2 class="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Личная информация</h2>
          <p class="mt-3 max-w-lg text-sm leading-6 text-ink/65">
            Эти данные помогут быстрее оформить следующий заказ.
          </p>
        </div>

        <form v-if="account.profile" class="mt-8 grid gap-5 sm:grid-cols-2" @submit.prevent="saveProfile">
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
            <p
              class="flex min-h-12 items-center break-all border border-seam bg-ice/50 px-4 font-normal text-ink/70"
            >
              {{ account.profile.email }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <p v-if="error" class="mb-4 text-sm text-error" role="alert">{{ error }}</p>
            <p v-if="saved" class="mb-4 text-sm font-semibold text-cobalt" role="status">Данные сохранены.</p>
            <button type="submit" class="shop-button-primary w-full sm:w-auto" :disabled="saving">
              {{ saving ? 'СОХРАНЯЕМ…' : 'СОХРАНИТЬ ИЗМЕНЕНИЯ' }}
            </button>
          </div>
        </form>
      </div>

      <aside class="bg-ice p-6 sm:p-8" aria-label="Разделы аккаунта">
        <p class="type-label text-cobalt">ЛИЧНЫЙ КАБИНЕТ</p>
        <h2 class="mt-3 text-xl font-bold text-ink">Всё под рукой</h2>
        <nav class="mt-5 border-t border-ink/15" aria-label="Разделы личного кабинета">
          <NuxtLink
            v-for="link in [
              { to: '/orders', label: 'Мои заказы' },
              { to: '/favorites', label: 'Избранное' },
              { to: '/notifications', label: 'Уведомления' },
              { to: '/settings', label: 'Настройки' },
            ]"
            :key="link.to"
            :to="link.to"
            class="flex min-h-14 items-center justify-between gap-4 border-b border-ink/15 text-sm font-semibold text-ink hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            {{ link.label }} <span aria-hidden="true">↗</span>
          </NuxtLink>
        </nav>
      </aside>
    </div>
  </section>
</template>
