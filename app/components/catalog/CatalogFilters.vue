<script setup lang="ts">
import { computed, ref } from 'vue'
import { CloseW400 as Close } from '@material-symbols-svg/vue/sharp/icons/close'
import { KeyboardArrowDownW400 as KeyboardArrowDown } from '@material-symbols-svg/vue/sharp/icons/keyboard-arrow-down'
import { emptyCatalogFilters, fabrics, russianSizes } from '~/data/catalog'
import type { CatalogFilterState, CatalogSort } from '~/data/catalog'

type FilterKey = 'shade' | 'size' | 'price' | 'sort'

const model = defineModel<CatalogFilterState>({ required: true })
const emit = defineEmits<{ reset: [] }>()
const activeMenu = ref<FilterKey | null>(null)
const priceMin = ref<string | number>('')
const priceMax = ref<string | number>('')
const priceError = ref('')
const filterPanelClass = 'max-h-[min(420px,calc(100dvh-96px))] w-[min(304px,calc(100vw-32px))] overflow-y-auto p-4 sm:p-5'
const pricePanelClass = 'max-h-[min(420px,calc(100dvh-96px))] w-[min(360px,calc(100vw-32px))] overflow-y-auto p-4 sm:p-5'

const controls: { key: FilterKey, label: string }[] = [
  { key: 'size', label: 'Размер' },
  { key: 'shade', label: 'Цвет' },
  { key: 'price', label: 'Цена' },
]

const sortOptions: { value: CatalogSort, label: string }[] = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
]

const hasSelection = computed(() => JSON.stringify(model.value) !== JSON.stringify(emptyCatalogFilters()))

function controlLabel(key: FilterKey, base: string) {
  const filters = model.value
  if (key === 'shade' && filters.shades.length) return `${base} · ${filters.shades.length}`
  if (key === 'size' && filters.sizes.length) return filters.sizes.length <= 2
    ? `${base} · ${filters.sizes.join(', ')}`
    : `Размеры · ${filters.sizes.length}`
  if (key === 'price' && (filters.minPrice || filters.maxPrice)) return `${base} · задана`
  if (key === 'sort' && filters.sort !== 'default') return filters.sort === 'price-asc' ? 'Сначала дешевле' : 'Сначала дороже'
  return base
}

function isSelected(key: FilterKey) {
  const filters = model.value
  if (key === 'shade') return filters.shades.length > 0
  if (key === 'size') return filters.sizes.length > 0
  if (key === 'price') return filters.minPrice !== '' || filters.maxPrice !== ''
  return filters.sort !== 'default'
}

function setMenu(key: FilterKey, next: boolean) {
  if (!next) {
    if (activeMenu.value === key) activeMenu.value = null
    return
  }
  priceError.value = ''
  if (key === 'price') {
    priceMin.value = model.value.minPrice
    priceMax.value = model.value.maxPrice
  }
  activeMenu.value = key
}

function closeMenu() {
  activeMenu.value = null
}

function toggleShade(name: string) {
  const shades = model.value.shades.includes(name)
    ? model.value.shades.filter(shade => shade !== name)
    : [...model.value.shades, name]
  model.value = { ...model.value, shades }
}

function toggleSize(size: string) {
  const selected = model.value.sizes.includes(size)
    ? model.value.sizes.filter(value => value !== size)
    : [...model.value.sizes, size]
  model.value = { ...model.value, sizes: russianSizes.filter(value => selected.includes(value)) }
}

function applyPrice() {
  const minimum = String(priceMin.value).trim()
  const maximum = String(priceMax.value).trim()
  if ((minimum && Number(minimum) < 0) || (maximum && Number(maximum) < 0)) {
    priceError.value = 'Цена не может быть отрицательной'
    return
  }
  if (minimum && maximum && Number(minimum) > Number(maximum)) {
    priceError.value = 'Цена «от» не может быть больше цены «до»'
    return
  }
  model.value = { ...model.value, minPrice: minimum, maxPrice: maximum }
  closeMenu()
}

function selectSort(sort: CatalogSort) {
  model.value = { ...model.value, sort }
  closeMenu()
}

</script>

<template>
  <section aria-label="Фильтры каталога" class="sticky top-[72px] z-20 hidden bg-white py-3 lg:block">
    <div class="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible lg:pb-0">
      <UiPopover
        v-for="control in controls"
        :key="control.key"
        :open="activeMenu === control.key"
        placement="bottom-start"
        root-class="inline-flex shrink-0"
        :panel-class="control.key === 'price' ? pricePanelClass : filterPanelClass"
        @update:open="setMenu(control.key, $event)"
      >
        <template #trigger="{ open, toggle, controls: triggerControls }">
          <button
            type="button"
            class="inline-flex min-h-10 items-center gap-2 whitespace-nowrap border px-4 text-sm transition-colors hover:border-cobalt hover:text-cobalt"
            :class="isSelected(control.key) || open ? 'border-cobalt bg-ice text-cobalt' : 'border-seam bg-white text-ink'"
            v-bind="triggerControls"
            @click="toggle"
          >
            {{ controlLabel(control.key, control.label) }}
            <KeyboardArrowDown :size="18" class="transition-transform duration-200" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
          </button>
        </template>
        <div class="mb-4 flex items-center justify-between gap-4">
          <h3 class="text-sm font-semibold text-ink">{{ control.label }}</h3>
          <button type="button" class="text-cobalt" aria-label="Закрыть фильтр" @click="setMenu(control.key, false)"><Close :size="19" aria-hidden="true" /></button>
        </div>
        <div v-if="control.key === 'shade'" class="grid gap-3">
            <label v-for="fabric in fabrics" :key="fabric.name" class="flex cursor-pointer items-center gap-3 text-sm text-ink">
              <input type="checkbox" class="size-4 accent-cobalt" :checked="model.shades.includes(fabric.name)" @change="toggleShade(fabric.name)">
              <span class="size-5 border border-ink/10" :style="{ backgroundColor: fabric.hex }" aria-hidden="true" />
              {{ fabric.name }}
            </label>
          </div>
          <div v-else-if="control.key === 'size'" class="grid grid-cols-4 gap-2">
            <label v-for="size in russianSizes" :key="size" class="cursor-pointer">
              <input type="checkbox" class="peer sr-only" :checked="model.sizes.includes(size)" :aria-label="`Размер ${size}`" @change="toggleSize(size)">
              <span class="flex h-10 items-center justify-center border border-seam text-sm font-semibold text-ink transition-colors peer-checked:border-cobalt peer-checked:bg-cobalt peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt">{{ size }}</span>
            </label>
          </div>
          <form v-else class="flex flex-wrap items-end gap-3" @submit.prevent="applyPrice">
            <label class="grid gap-2 text-sm text-ink">
              Цена от, ₽
              <input v-model="priceMin" type="number" min="0" step="1" inputmode="numeric" placeholder="0" class="h-11 w-32 border border-seam px-3 outline-none focus:border-cobalt">
            </label>
            <label class="grid gap-2 text-sm text-ink">
              Цена до, ₽
              <input v-model="priceMax" type="number" min="0" step="1" inputmode="numeric" placeholder="Любая" class="h-11 w-32 border border-seam px-3 outline-none focus:border-cobalt">
            </label>
            <button type="submit" class="h-11 bg-cobalt px-5 text-sm font-semibold text-white hover:bg-ink">Применить</button>
            <p v-if="priceError" class="w-full text-sm text-error" role="alert">{{ priceError }}</p>
          </form>
      </UiPopover>
      <button
        type="button"
        class="inline-flex min-h-10 shrink-0 items-center border px-4 text-sm font-semibold transition-colors"
        :class="model.sale ? 'border-sale bg-sale text-white' : 'border-seam bg-white text-sale hover:border-sale'"
        :aria-pressed="model.sale"
        @click="model = { ...model, sale: !model.sale }; activeMenu = null"
      >Со скидкой</button>
      <button
        type="button"
        class="inline-flex min-h-10 shrink-0 items-center border px-4 text-sm font-semibold transition-colors"
        :class="model.inStock ? 'border-cobalt bg-cobalt text-white' : 'border-seam bg-white text-ink hover:border-cobalt hover:text-cobalt'"
        :aria-pressed="model.inStock"
        @click="model = { ...model, inStock: !model.inStock }; activeMenu = null"
      >В наличии</button>
      <UiPopover :open="activeMenu === 'sort'" placement="bottom-start" root-class="inline-flex shrink-0" :panel-class="filterPanelClass" @update:open="setMenu('sort', $event)">
        <template #trigger="{ open, toggle, controls: triggerControls }">
          <button
            type="button"
            class="inline-flex min-h-10 items-center gap-2 whitespace-nowrap border px-4 text-sm transition-colors hover:border-cobalt hover:text-cobalt"
            :class="isSelected('sort') || open ? 'border-cobalt bg-ice text-cobalt' : 'border-seam bg-white text-ink'"
            v-bind="triggerControls"
            @click="toggle"
          >{{ controlLabel('sort', 'Сортировка') }}<KeyboardArrowDown :size="18" class="transition-transform duration-200" :class="open ? 'rotate-180' : ''" aria-hidden="true" /></button>
        </template>
        <div class="mb-4 flex items-center justify-between gap-4">
          <h3 class="text-sm font-semibold text-ink">Сортировка</h3>
          <button type="button" class="text-cobalt" aria-label="Закрыть фильтр" @click="setMenu('sort', false)"><Close :size="19" aria-hidden="true" /></button>
        </div>
        <div class="grid gap-3">
          <label v-for="option in sortOptions" :key="option.value" class="flex cursor-pointer items-center gap-3 text-sm text-ink">
            <input type="radio" name="catalog-sort" class="size-4 accent-cobalt" :checked="model.sort === option.value" @change="selectSort(option.value)">
            {{ option.label }}
          </label>
        </div>
      </UiPopover>
      <button v-if="hasSelection" type="button" class="shrink-0 whitespace-nowrap px-2 py-2 text-sm text-cobalt underline underline-offset-4" @click="emit('reset'); activeMenu = null">
        Сбросить
      </button>
    </div>
  </section>
</template>
