<script setup lang="ts">
import { computed } from 'vue';
import { KeyboardArrowLeftW400 as ArrowLeft } from '@material-symbols-svg/vue/sharp/icons/keyboard-arrow-left';
import { KeyboardArrowRightW400 as ArrowRight } from '@material-symbols-svg/vue/sharp/icons/keyboard-arrow-right';

const props = defineProps<{
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}>();
const emit = defineEmits<{ 'update:page': [page: number] }>();

const firstItem = computed(() => (props.page - 1) * props.pageSize + 1);
const lastItem = computed(() => Math.min(props.page * props.pageSize, props.totalItems));
const pageItems = computed(() => {
  const pages = new Set(
    [1, props.totalPages, props.page - 1, props.page, props.page + 1].filter(
      (page) => page >= 1 && page <= props.totalPages,
    ),
  );
  const sorted = [...pages].sort((a, b) => a - b);
  const items: (number | string)[] = [];

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous && page - previous === 2) items.push(previous + 1);
    else if (previous && page - previous > 2) items.push(`ellipsis-${previous}`);
    items.push(page);
  });

  return items;
});

function selectPage(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.page) emit('update:page', page);
}
</script>

<template>
  <nav
    aria-label="Страницы каталога"
    class="mt-10 flex flex-col gap-4 border-t border-seam pt-6 sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="text-sm text-ink/60">Показано {{ firstItem }}–{{ lastItem }} из {{ totalItems }}</p>
    <div class="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        class="flex min-h-11 items-center gap-1 border border-seam px-2.5 text-sm text-ink transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-default disabled:opacity-35 disabled:hover:border-seam disabled:hover:text-ink sm:px-3"
        aria-label="Предыдущая страница"
        :disabled="page === 1"
        @click="selectPage(page - 1)"
      >
        <ArrowLeft class="size-5" aria-hidden="true" /><span class="hidden sm:inline">Назад</span>
      </button>

      <template v-for="item in pageItems" :key="item">
        <span
          v-if="typeof item === 'string'"
          class="flex min-h-11 min-w-6 items-center justify-center text-ink/50"
          aria-hidden="true"
          >…</span
        >
        <button
          v-else
          type="button"
          class="min-h-11 min-w-11 border px-2 text-sm font-semibold transition-colors"
          :class="
            item === page
              ? 'border-cobalt bg-cobalt text-white'
              : 'border-seam text-ink hover:border-cobalt hover:text-cobalt'
          "
          :aria-label="`Страница ${item}`"
          :aria-current="item === page ? 'page' : undefined"
          @click="selectPage(item)"
        >
          {{ item }}
        </button>
      </template>

      <button
        type="button"
        class="flex min-h-11 items-center gap-1 border border-seam px-2.5 text-sm text-ink transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-default disabled:opacity-35 disabled:hover:border-seam disabled:hover:text-ink sm:px-3"
        aria-label="Следующая страница"
        :disabled="page === totalPages"
        @click="selectPage(page + 1)"
      >
        <span class="hidden sm:inline">Далее</span><ArrowRight class="size-5" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>
