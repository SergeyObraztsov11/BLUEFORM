<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CloseW400 as Close } from '@material-symbols-svg/vue/sharp/icons/close';
import { NotificationsW400 as Notifications } from '@material-symbols-svg/vue/sharp/icons/notifications';
import { useNotificationsStore } from '~/stores/notifications';

const props = withDefaults(defineProps<{ rootClass?: string; dismiss?: number }>(), {
  rootClass: 'inline-flex',
  dismiss: 0,
});
const emit = defineEmits<{ open: [] }>();
const open = ref(false);
const notifications = useNotificationsStore();

watch(
  () => props.dismiss,
  () => {
    open.value = false;
  },
);
watch(open, (value) => {
  if (value) {
    emit('open');
    if (!notifications.loaded) void notifications.load();
  }
});

const preview = computed(() => notifications.items.slice(0, 5));
const unreadCount = computed(() => notifications.unreadCount);

function formatWhen(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function openItem(id: string, href: string | null) {
  await notifications.markRead(id);
  open.value = false;
  if (href) await navigateTo(href);
}
</script>

<template>
  <UiPopover
    v-model:open="open"
    placement="bottom-end"
    :root-class="props.rootClass"
    panel-class="w-[min(350px,calc(100vw-32px))] p-4 sm:p-5"
  >
    <template #trigger="{ toggle, controls }">
      <button
        type="button"
        class="relative flex size-10 items-center justify-center text-ink transition-colors hover:text-cobalt"
        :aria-label="unreadCount ? `Уведомления, ${unreadCount} непрочитанных` : 'Уведомления'"
        title="Уведомления"
        v-bind="controls"
        @click="toggle"
      >
        <Notifications :size="24" aria-hidden="true" />
        <span
          v-if="unreadCount"
          class="pointer-events-none absolute bottom-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-cobalt px-1 text-[10px] font-bold leading-none text-white"
          aria-hidden="true"
          >{{ unreadCount > 9 ? '9+' : unreadCount }}</span
        >
      </button>
    </template>
    <section aria-label="Уведомления" class="flex max-h-[min(440px,calc(100dvh-136px))] min-h-0 flex-col">
      <div class="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p class="type-label text-cobalt">УВЕДОМЛЕНИЯ</p>
          <p class="mt-1 text-xs text-ink/55">
            {{ unreadCount ? `${unreadCount} новых` : 'Нет новых' }}
          </p>
        </div>
        <button
          type="button"
          class="-mr-1 -mt-1 flex size-8 items-center justify-center text-ink/60 hover:text-cobalt"
          aria-label="Закрыть уведомления"
          @click="open = false"
        >
          <Close :size="20" aria-hidden="true" />
        </button>
      </div>
      <ul v-if="preview.length" class="mt-4 min-h-0 divide-y divide-seam border-y border-seam">
        <li v-for="item in preview" :key="item.id">
          <button
            type="button"
            class="w-full py-3 text-left transition-colors hover:bg-ice/70"
            @click="openItem(item.id, item.href)"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="text-[13px] font-semibold leading-5 text-ink">{{ item.title }}</p>
              <span
                v-if="!item.read"
                class="mt-1 size-2 shrink-0 rounded-full bg-cobalt"
                aria-hidden="true"
              />
            </div>
            <p class="mt-1 text-xs leading-5 text-ink/60">{{ item.body }}</p>
            <p class="mt-1 text-[11px] text-ink/45">{{ formatWhen(item.createdAt) }}</p>
          </button>
        </li>
      </ul>
      <p v-else class="mt-4 border-y border-seam py-5 text-sm text-ink/60">Пока нет уведомлений.</p>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          v-if="unreadCount"
          type="button"
          class="text-xs font-semibold text-cobalt hover:text-ink"
          @click="notifications.markAllRead()"
        >
          Прочитать все
        </button>
        <NuxtLink
          to="/notifications"
          class="ml-auto text-xs font-semibold text-cobalt hover:text-ink"
          @click="open = false"
        >
          Все уведомления
        </NuxtLink>
      </div>
    </section>
  </UiPopover>
</template>
