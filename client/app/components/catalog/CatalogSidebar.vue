<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { KeyboardArrowDownW400 as ArrowDown } from '@material-symbols-svg/vue/sharp/icons/keyboard-arrow-down';
import { categoryBranchFrom } from '~/composables/useCatalogCategories';
import type { CatalogCategory } from '~/data/catalog';

const selected = defineModel<CatalogCategory>({ required: true });
const { data } = await useCatalogCategories();
const items = computed(() => data.value?.items ?? []);
const expandedAudience = ref<string | null>(null);
const expandedGroup = ref<string | null>(null);
const audiences = computed(() => items.value.filter((item) => item.parent === null));
const groupsFor = (parent: string) => items.value.filter((item) => item.parent === parent);
const hasChildren = (slug: string) => items.value.some((item) => item.parent === slug);

function expandSelected(slug: string) {
  if (slug === 'all') return;
  const branch = categoryBranchFrom(items.value, slug);
  expandedAudience.value = branch[0] ?? null;
  expandedGroup.value = branch[1] ?? null;
}

watch(items, () => expandSelected(selected.value), { immediate: true });
watch(selected, (slug) => expandSelected(slug));
</script>

<template>
  <aside aria-label="Категории каталога" class="hidden lg:sticky lg:top-24 lg:block lg:self-start">
    <h2 class="type-label mb-4 text-cobalt">КАТЕГОРИИ</h2>
    <button
      type="button"
      class="w-full border-b border-seam px-3 py-3 text-left text-sm font-medium transition-colors hover:text-cobalt"
      :class="selected === 'all' ? 'bg-ink text-white hover:text-white' : 'text-ink'"
      :aria-current="selected === 'all' ? 'page' : undefined"
      @click="selected = 'all'"
    >
      Все товары
    </button>
    <div v-for="audience in audiences" :key="audience.slug">
      <div class="flex border-b border-seam">
        <button
          type="button"
          class="min-w-0 flex-1 px-3 py-3 text-left text-sm font-semibold transition-colors hover:text-cobalt"
          :class="selected === audience.slug ? 'text-cobalt' : 'text-ink'"
          :aria-current="selected === audience.slug ? 'page' : undefined"
          @click="
            selected = audience.slug;
            expandedAudience = audience.slug;
            expandedGroup = null;
          "
        >
          {{ audience.name }}
        </button>
        <button
          type="button"
          class="flex w-9 items-center justify-center text-ink/60 hover:text-cobalt"
          :aria-label="`Показать категории: ${audience.name}`"
          :aria-expanded="expandedAudience === audience.slug"
          @click="expandedAudience = expandedAudience === audience.slug ? null : audience.slug"
        >
          <ArrowDown
            :size="18"
            class="transition-transform"
            :class="expandedAudience === audience.slug ? 'rotate-180' : ''"
            aria-hidden="true"
          />
        </button>
      </div>
      <div
        class="grid transition-[grid-template-rows,opacity] duration-300"
        :class="
          expandedAudience === audience.slug ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        "
        :inert="expandedAudience !== audience.slug"
      >
        <div class="min-h-0 overflow-hidden">
          <div v-for="group in groupsFor(audience.slug)" :key="group.slug" class="ml-3 border-l border-seam">
            <div class="flex">
              <button
                type="button"
                class="min-w-0 flex-1 px-3 py-2.5 text-left text-[13px] font-medium transition-colors hover:text-cobalt"
                :class="selected === group.slug ? 'text-cobalt' : 'text-ink/80'"
                :aria-current="selected === group.slug ? 'page' : undefined"
                @click="
                  selected = group.slug;
                  expandedGroup = group.slug;
                "
              >
                {{ group.name }}
              </button>
              <button
                v-if="hasChildren(group.slug)"
                type="button"
                class="flex w-8 items-center justify-center text-ink/50 hover:text-cobalt"
                :aria-label="`Показать фасоны: ${group.name}`"
                :aria-expanded="expandedGroup === group.slug"
                @click="expandedGroup = expandedGroup === group.slug ? null : group.slug"
              >
                <ArrowDown
                  :size="16"
                  class="transition-transform"
                  :class="expandedGroup === group.slug ? 'rotate-180' : ''"
                  aria-hidden="true"
                />
              </button>
            </div>
            <div
              v-if="hasChildren(group.slug)"
              class="grid transition-[grid-template-rows,opacity] duration-300"
              :class="
                expandedGroup === group.slug ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              "
              :inert="expandedGroup !== group.slug"
            >
              <div class="min-h-0 overflow-hidden">
                <button
                  v-for="leaf in groupsFor(group.slug)"
                  :key="leaf.slug"
                  type="button"
                  class="block w-full px-5 py-2 text-left text-[13px] transition-colors hover:text-cobalt"
                  :class="selected === leaf.slug ? 'font-semibold text-cobalt' : 'text-ink/65'"
                  :aria-current="selected === leaf.slug ? 'page' : undefined"
                  @click="selected = leaf.slug"
                >
                  {{ leaf.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
