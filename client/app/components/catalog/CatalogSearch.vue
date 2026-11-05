<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { SearchW400 as Search } from '@material-symbols-svg/vue/sharp/icons/search';
import { useDismissableLayer } from '~/composables/useDismissableLayer';

const query = defineModel<string>({ required: true });
const draft = ref(query.value);
const suggestionDismissed = ref(Boolean(query.value.trim()));
const root = ref<HTMLElement | null>(null);

const { data: options } = await useCatalogOptions();
const suggestionOptions = computed(() => [
  ...(options.value?.products ?? []).map((label) => ({
    label,
    kind: 'Товар',
    hex: '',
  })),
  ...(options.value?.colors ?? []).map((fabric) => ({ label: fabric.name, kind: 'Цвет', hex: fabric.hex })),
]);
const suggestions = computed(() => {
  const typed = draft.value.trim().toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');
  if (!typed) return [];
  return suggestionOptions.value
    .filter((option) => option.label.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').includes(typed))
    .slice(0, 5);
});
const showSuggestions = computed(() => !suggestionDismissed.value && suggestions.value.length > 0);

watch(query, (value) => {
  draft.value = value;
  suggestionDismissed.value = true;
});
watch(
  draft,
  () => {
    suggestionDismissed.value = false;
  },
  { flush: 'sync' },
);
useDismissableLayer(root, showSuggestions, () => {
  suggestionDismissed.value = true;
});

function submitSearch() {
  query.value = draft.value.trim();
  suggestionDismissed.value = true;
}

function chooseSuggestion(value: string) {
  draft.value = value;
  query.value = value;
  suggestionDismissed.value = true;
}
</script>

<template>
  <div ref="root" class="relative">
    <form
      role="search"
      aria-label="Поиск по каталогу"
      class="flex h-12 items-center border border-seam bg-white text-ink transition-colors focus-within:border-cobalt"
      @submit.prevent="submitSearch"
    >
      <label for="catalog-search" class="sr-only">Найти джинсы или цвет</label>
      <input
        id="catalog-search"
        v-model="draft"
        type="text"
        inputmode="search"
        autocomplete="off"
        maxlength="100"
        placeholder="Найти джинсы или цвет"
        class="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-ink/45 sm:text-base"
      />
      <button
        type="submit"
        class="flex h-full shrink-0 items-center justify-center gap-2 bg-cobalt px-4 text-xs font-bold tracking-[0.075em] text-white transition-colors hover:bg-ink sm:px-5"
      >
        <Search :size="19" aria-hidden="true" />ПОИСК
      </button>
    </form>

    <Transition name="bf-suggest"
      ><div
        v-if="showSuggestions"
        class="shop-popover absolute inset-x-0 top-[calc(100%+6px)] z-30 border border-seam bg-white p-2"
      >
        <p class="px-3 pb-2 pt-1 text-[11px] font-bold tracking-[0.075em] text-cobalt">ПОДСКАЗКИ</p>
        <button
          v-for="suggestion in suggestions"
          :key="suggestion.label"
          type="button"
          class="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-ice focus-visible:bg-ice focus-visible:outline-none"
          @click="chooseSuggestion(suggestion.label)"
        >
          <span
            v-if="suggestion.hex"
            class="size-5 shrink-0 border border-ink/10"
            :style="{ backgroundColor: suggestion.hex }"
            aria-hidden="true"
          />
          <Search v-else :size="20" class="shrink-0 text-cobalt" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate">{{ suggestion.label }}</span>
          <span class="shrink-0 text-[11px] text-ink/50">{{ suggestion.kind }}</span>
        </button>
      </div></Transition
    >
  </div>
</template>
