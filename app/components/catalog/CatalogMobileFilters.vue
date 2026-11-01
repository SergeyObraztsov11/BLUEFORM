<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CloseW400 as Close } from '@material-symbols-svg/vue/sharp/icons/close'
import { FilterListW400 as FilterList } from '@material-symbols-svg/vue/sharp/icons/filter-list'
import { KeyboardArrowDownW400 as KeyboardArrowDown } from '@material-symbols-svg/vue/sharp/icons/keyboard-arrow-down'
import { emptyCatalogFilters, fabrics, russianSizes } from '~/data/catalog'
import { buildCatalogQuery } from '~/utils/catalogQuery'
import type { CatalogCategory, CatalogFilterState, CatalogPage, CatalogSort } from '~/data/catalog'

const filters = defineModel<CatalogFilterState>({ required: true })
const category = defineModel<CatalogCategory>('category', { required: true })
const props = defineProps<{ search: string }>()
const { data: categoryTree } = await useCatalogCategories()
const categories = computed(() => categoryTree.value?.items ?? [])

const visible = ref(false)
const closeButton = ref<HTMLButtonElement | null>(null)
const draft = ref<CatalogFilterState>(emptyCatalogFilters())
const draftCategory = ref<CatalogCategory>('all')
const sortOptions: { value: CatalogSort, label: string }[] = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
]
const selectedCount = computed(() => Number(filters.value.sale) + Number(filters.value.inStock)
  + Number(filters.value.shades.length > 0) + Number(filters.value.sizes.length > 0)
  + Number(filters.value.minPrice !== '' || filters.value.maxPrice !== '')
  + Number(filters.value.sort !== 'default') + Number(category.value !== 'all'))
const priceInvalid = computed(() => Number(draft.value.minPrice) < 0 || Number(draft.value.maxPrice) < 0
  || (draft.value.minPrice !== '' && draft.value.maxPrice !== ''
    && Number(draft.value.minPrice) > Number(draft.value.maxPrice)))
const resultCount = ref(0)
let resultRequest = 0
watch([draft, draftCategory, () => props.search, visible], async () => {
  if (!visible.value) return
  const request = ++resultRequest
  const query = buildCatalogQuery({}, draftCategory.value, draft.value, 1, props.search)
  try {
    const page = await $fetch<CatalogPage>('/api/catalog/products', { query })
    if (request === resultRequest) resultCount.value = page.total
  } catch {
    if (request === resultRequest) resultCount.value = 0
  }
}, { deep: true })
const resultLabel = computed(() => {
  const count = resultCount.value
  const teen = count % 100 >= 11 && count % 100 <= 14
  const last = count % 10
  return `${count} ${!teen && last === 1 ? 'товар' : !teen && last >= 2 && last <= 4 ? 'товара' : 'товаров'}`
})

function openFilters() {
  draft.value = { ...filters.value, shades: [...filters.value.shades], sizes: [...filters.value.sizes] }
  draftCategory.value = category.value
  visible.value = true
}

function toggleShade(name: string) {
  draft.value.shades = draft.value.shades.includes(name)
    ? draft.value.shades.filter(shade => shade !== name)
    : [...draft.value.shades, name]
}

function toggleSize(size: string) {
  draft.value.sizes = draft.value.sizes.includes(size)
    ? draft.value.sizes.filter(item => item !== size)
    : russianSizes.filter(item => [...draft.value.sizes, size].includes(item))
}

function resetDraft() {
  draft.value = emptyCatalogFilters()
  draftCategory.value = 'all'
}

function applyFilters() {
  if (priceInvalid.value) return
  filters.value = { ...draft.value, shades: [...draft.value.shades], sizes: [...draft.value.sizes] }
  category.value = draftCategory.value
  visible.value = false
}
</script>

<template>
  <div class="sticky top-16 z-20 bg-white py-3 lg:hidden">
    <button type="button" class="flex min-h-12 w-full items-center justify-between border border-cobalt bg-white px-4 text-sm font-bold text-cobalt transition-colors hover:bg-ice" :aria-expanded="visible" aria-controls="catalog-mobile-filter-panel" @click="openFilters">
      <span class="flex items-center gap-2.5"><FilterList :size="21" aria-hidden="true" /> Фильтры и сортировка</span>
      <span v-if="selectedCount" class="flex size-6 items-center justify-center bg-cobalt text-xs text-white">{{ selectedCount }}</span>
    </button>
  </div>

  <UiModalShell :visible="visible" labelled-by="catalog-mobile-filter-title" placement="fullscreen" panel-class="flex h-dvh w-full flex-col bg-white lg:hidden" @close="visible = false" @opened="closeButton?.focus({ preventScroll: true })">
    <div id="catalog-mobile-filter-panel" class="flex h-full min-h-0 flex-col">
      <div class="shrink-0 bg-cobalt px-6 py-6 text-white">
        <div class="mx-auto flex w-full max-w-[640px] items-start justify-between gap-4">
          <div>
            <p class="type-label text-white/80">BLUEFORM / КАТАЛОГ</p>
            <h2 id="catalog-mobile-filter-title" class="type-heading mt-3 text-[28px]">ФИЛЬТРЫ</h2>
          </div>
          <button ref="closeButton" type="button" class="-mr-2 -mt-2 flex size-10 shrink-0 items-center justify-center text-white hover:bg-white/15" aria-label="Закрыть фильтры" @click="visible = false"><Close :size="24" aria-hidden="true" /></button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overscroll-contain overflow-y-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div class="mx-auto w-full max-w-[640px] pb-6">
          <section aria-labelledby="mobile-sort-heading" class="border-b border-seam py-5">
            <h3 id="mobile-sort-heading" class="type-label mb-4 text-cobalt">СОРТИРОВКА</h3>
            <div class="relative">
              <select v-model="draft.sort" aria-label="Порядок товаров" class="h-12 w-full appearance-none border border-seam bg-white pl-4 pr-12 text-sm font-semibold text-ink outline-none focus:border-cobalt">
                <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <KeyboardArrowDown :size="22" class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-cobalt" aria-hidden="true" />
            </div>
          </section>

          <section aria-labelledby="mobile-price-heading" class="border-b border-seam py-5">
            <h3 id="mobile-price-heading" class="type-label mb-4 text-cobalt">ЦЕНА И СКИДКИ</h3>
            <div class="grid grid-cols-2 gap-3">
              <label class="grid gap-2 text-xs text-ink/65">От, ₽<input v-model="draft.minPrice" type="number" min="0" inputmode="numeric" placeholder="0" class="h-12 min-w-0 border border-seam px-3 text-base text-ink outline-none focus:border-cobalt"></label>
              <label class="grid gap-2 text-xs text-ink/65">До, ₽<input v-model="draft.maxPrice" type="number" min="0" inputmode="numeric" placeholder="Любая" class="h-12 min-w-0 border border-seam px-3 text-base text-ink outline-none focus:border-cobalt"></label>
            </div>
            <p v-if="priceInvalid" class="mt-2 text-sm text-error" role="alert">Проверь диапазон цен</p>
            <label class="mt-4 flex min-h-12 cursor-pointer items-center justify-between gap-3 border-t border-seam pt-3 text-sm font-semibold text-sale">
              Только со скидкой<input v-model="draft.sale" type="checkbox" class="size-5 shrink-0 accent-sale">
            </label>
            <label class="mt-1 flex min-h-12 cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-ink">
              Только в наличии<input v-model="draft.inStock" type="checkbox" class="size-5 shrink-0 accent-cobalt">
            </label>
          </section>

          <section aria-labelledby="mobile-category-heading" class="border-b border-seam py-5">
            <h3 id="mobile-category-heading" class="type-label mb-4 text-cobalt">КАТЕГОРИЯ</h3>
            <div class="relative">
              <select v-model="draftCategory" aria-label="Раздел каталога" class="h-12 w-full appearance-none border border-seam bg-white pl-4 pr-12 text-sm font-semibold text-ink outline-none focus:border-cobalt">
                <option value="all">Все товары</option>
                <template v-for="audience in categories.filter(item => item.parent === null)" :key="audience.slug">
                  <option :value="audience.slug">{{ audience.name }}</option>
                  <optgroup v-for="group in categories.filter(item => item.parent === audience.slug)" :key="group.slug" :label="`${audience.name} / ${group.name}`">
                    <option :value="group.slug">Все — {{ group.name.toLocaleLowerCase('ru-RU') }}</option>
                    <option v-for="leaf in categories.filter(item => item.parent === group.slug)" :key="leaf.slug" :value="leaf.slug">{{ leaf.name }}</option>
                  </optgroup>
                </template>
              </select>
              <KeyboardArrowDown :size="22" class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-cobalt" aria-hidden="true" />
            </div>
          </section>

          <section aria-labelledby="mobile-size-heading" class="border-b border-seam py-5">
            <h3 id="mobile-size-heading" class="type-label mb-4 text-cobalt">РАЗМЕР</h3>
            <div role="group" aria-labelledby="mobile-size-heading" class="grid grid-cols-4 gap-2">
              <label v-for="size in russianSizes" :key="size" class="cursor-pointer">
                <input type="checkbox" class="peer sr-only" :checked="draft.sizes.includes(size)" :aria-label="`Размер ${size}`" @change="toggleSize(size)">
                <span class="flex h-12 items-center justify-center border border-seam text-sm font-semibold text-ink peer-checked:border-cobalt peer-checked:bg-cobalt peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt">{{ size }}</span>
              </label>
            </div>
          </section>

          <section aria-labelledby="mobile-shade-heading" class="border-b border-seam py-5">
            <h3 id="mobile-shade-heading" class="type-label mb-4 text-cobalt">ЦВЕТ</h3>
            <div role="group" aria-labelledby="mobile-shade-heading" class="grid gap-0.5">
              <label v-for="fabric in fabrics" :key="fabric.name" class="flex min-h-12 cursor-pointer items-center gap-3 text-sm font-medium text-ink">
                <span class="size-7 shrink-0 border border-ink/10" :style="{ backgroundColor: fabric.hex }" aria-hidden="true" />
                <span class="min-w-0 flex-1">{{ fabric.name }}</span>
                <input type="checkbox" class="size-5 shrink-0 accent-cobalt" :checked="draft.shades.includes(fabric.name)" @change="toggleShade(fabric.name)">
              </label>
            </div>
          </section>

        </div>
      </div>

      <div class="shrink-0 border-t border-seam bg-white px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_24px_rgba(16,43,78,0.05)]">
        <div class="mx-auto flex w-full max-w-[640px] items-center gap-4">
          <button type="button" class="min-h-12 shrink-0 text-sm font-semibold text-cobalt underline underline-offset-4" @click="resetDraft">Сбросить</button>
          <button type="button" class="min-h-12 min-w-0 flex-1 bg-cobalt px-3 text-sm font-bold text-white disabled:opacity-50" :disabled="priceInvalid" @click="applyFilters">Показать {{ resultLabel }}</button>
        </div>
      </div>
    </div>
  </UiModalShell>
</template>
