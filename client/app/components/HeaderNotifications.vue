<script setup lang="ts">
import { ref, watch } from 'vue';
import { CloseW400 as Close } from '@material-symbols-svg/vue/sharp/icons/close';
import { NotificationsW400 as Notifications } from '@material-symbols-svg/vue/sharp/icons/notifications';

const props = withDefaults(defineProps<{ rootClass?: string; dismiss?: number }>(), {
  rootClass: 'inline-flex',
  dismiss: 0,
});
const emit = defineEmits<{ open: [] }>();
const open = ref(false);

watch(
  () => props.dismiss,
  () => {
    open.value = false;
  },
);
watch(open, (value) => {
  if (value) emit('open');
});

const items = [
  { id: 'order', title: 'Заказ принят', text: 'Мы получили заказ и начали его собирать.' },
  {
    id: 'stock',
    title: 'Снова в наличии',
    text: 'Свободный силуэт в оттенке индиго — нужный размер вернулся.',
  },
];
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
        :aria-label="`Уведомления, ${items.length}`"
        title="Уведомления"
        v-bind="controls"
        @click="toggle"
      >
        <Notifications :size="24" aria-hidden="true" />
        <span
          class="pointer-events-none absolute bottom-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-cobalt px-1 text-[10px] font-bold leading-none text-white"
          aria-hidden="true"
          >{{ items.length }}</span
        >
      </button>
    </template>
    <section aria-label="Уведомления" class="flex max-h-[min(440px,calc(100dvh-136px))] min-h-0 flex-col">
      <div class="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p class="type-label text-cobalt">УВЕДОМЛЕНИЯ</p>
          <p class="mt-1 text-xs text-ink/55">{{ items.length }} новых</p>
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
      <ul class="mt-4 min-h-0 divide-y divide-seam border-y border-seam">
        <li v-for="item in items" :key="item.id" class="py-3">
          <p class="text-[13px] font-semibold leading-5 text-ink">{{ item.title }}</p>
          <p class="mt-1 text-xs leading-5 text-ink/60">{{ item.text }}</p>
        </li>
      </ul>
    </section>
  </UiPopover>
</template>
