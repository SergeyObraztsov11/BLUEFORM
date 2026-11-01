<script setup lang="ts">
import { onMounted } from 'vue';
import { useNotificationsStore } from '~/stores/notifications';

definePageMeta({ middleware: 'account' });
useHead({ title: 'Уведомления — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });

const notifications = useNotificationsStore();

onMounted(() => {
  if (!notifications.loaded) void notifications.load();
});

function formatWhen(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function openItem(id: string, href: string | null) {
  await notifications.markRead(id);
  if (href) await navigateTo(href);
}
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner
      title="УВЕДОМЛЕНИЯ"
      lead="Заказы, регистрация и изменения статуса появятся здесь."
    />

    <div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-seam pt-6">
      <p class="text-sm text-ink/65">
        {{
          notifications.unreadCount
            ? `${notifications.unreadCount} непрочитанных`
            : 'Все уведомления прочитаны'
        }}
      </p>
      <button
        v-if="notifications.unreadCount"
        type="button"
        class="text-sm font-semibold text-cobalt hover:text-ink"
        @click="notifications.markAllRead()"
      >
        Прочитать все
      </button>
    </div>

    <p v-if="notifications.error" class="mt-4 text-sm text-error" role="alert">
      {{ notifications.error }}
    </p>

    <ul v-if="notifications.items.length" class="mt-4 divide-y divide-seam border-b border-seam">
      <li v-for="item in notifications.items" :key="item.id">
        <button
          type="button"
          class="flex w-full flex-col gap-2 py-5 text-left transition-colors hover:bg-ice/50"
          @click="openItem(item.id, item.href)"
        >
          <div class="flex items-start justify-between gap-3">
            <h2 class="text-base font-semibold text-ink">{{ item.title }}</h2>
            <span
              v-if="!item.read"
              class="mt-1.5 size-2 shrink-0 rounded-full bg-cobalt"
              aria-label="Непрочитано"
            />
          </div>
          <p class="max-w-[720px] text-sm leading-6 text-ink/70">{{ item.body }}</p>
          <p class="text-xs text-ink/45">{{ formatWhen(item.createdAt) }}</p>
        </button>
      </li>
    </ul>

    <div v-else class="mt-10 py-12 text-center">
      <p class="text-lg font-semibold text-ink">Пока нет уведомлений</p>
      <p class="mt-2 text-sm text-ink/60">Они появятся после регистрации и оформления заказа.</p>
      <NuxtLink to="/catalog" class="shop-button-primary mt-6">ПОСМОТРЕТЬ КАТАЛОГ</NuxtLink>
    </div>
  </section>
</template>
