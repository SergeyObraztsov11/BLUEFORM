<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { emptyCatalogFilters } from '~/data/catalog'
import { buildCatalogQuery, catalogQuerySignature, parseCatalogQuery } from '~/utils/catalogQuery'
import type { CatalogCategory } from '~/data/catalog'

const { data: catalog, status: catalogStatus } = await useCatalogProducts()
const { data: categoryTree } = await useCatalogCategories()
const products = computed(() => catalog.value?.items ?? [])
const pageSize = computed(() => catalog.value?.pageSize ?? 8)
const route = useRoute()
const router = useRouter()
const initialQuery = parseCatalogQuery(route.query)
const category = ref<CatalogCategory>(initialQuery.category)
const filters = ref(initialQuery.filters)
const page = ref(initialQuery.page)
const search = ref(initialQuery.search)
const internalQueries = new Set<string>()
let applyingRoute = false
const resultsHeading = ref<HTMLElement | null>(null)

const categoryModel = computed({
  get: () => category.value,
  set: (value: CatalogCategory) => {
    if (value === category.value) return
    category.value = value
    page.value = 1
  },
})
const filtersModel = computed({
  get: () => filters.value,
  set: (value: typeof filters.value) => {
    filters.value = value
    page.value = 1
  },
})
const searchModel = computed({
  get: () => search.value,
  set: (value: string) => {
    search.value = value
    page.value = 1
  },
})

watch(() => route.query, (query) => {
  const signature = catalogQuerySignature(query)
  if (internalQueries.has(signature)) {
    internalQueries.delete(signature)
    return
  }

  const restored = parseCatalogQuery(query)
  applyingRoute = true
  category.value = restored.category
  filters.value = restored.filters
  page.value = restored.page
  search.value = restored.search
  void nextTick(() => { applyingRoute = false })
})

watch([category, filters, page, search], () => {
  if (applyingRoute) return
  const query = buildCatalogQuery(route.query, category.value, filters.value, page.value, search.value)
  const signature = catalogQuerySignature(query)
  if (signature === catalogQuerySignature(route.query)) return

  internalQueries.add(signature)
  void router.replace({ query, hash: route.hash }).finally(() => internalQueries.delete(signature))
}, { deep: true })

const totalPages = computed(() => Math.max(1, Math.ceil((catalog.value?.total ?? 0) / pageSize.value)))
const currentPage = computed(() => Math.min(page.value, totalPages.value))

onMounted(() => {
  if (page.value !== currentPage.value) page.value = currentPage.value
  if ('fit' in route.query) void router.replace({ query: buildCatalogQuery(route.query, category.value, filters.value, page.value, search.value), hash: route.hash })
})

const categoryTitle = computed(() => category.value === 'all' ? 'Все товары' : categoryTree.value?.items.find(item => item.slug === category.value)?.name ?? 'Все товары')
const productCount = computed(() => {
  const count = catalog.value?.total ?? 0
  const remainder = count % 10
  const teen = count % 100 >= 11 && count % 100 <= 14
  const noun = remainder === 1 && !teen ? 'товар' : remainder >= 2 && remainder <= 4 && !teen ? 'товара' : 'товаров'
  return `${count} ${noun}`
})

function resetFilters() {
  category.value = 'all'
  filters.value = emptyCatalogFilters()
  page.value = 1
}

function resetAll() {
  resetFilters()
  search.value = ''
}

async function selectPage(value: number) {
  page.value = value
  await nextTick()
  resultsHeading.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

useHead({
  title: 'Каталог одежды из денима — BLUEFORM',
  meta: [{
    name: 'description',
    content: 'Каталог BLUEFORM: джинсы, шорты, юбки, комбинезоны и джинсовые куртки.',
  }, { name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <section class="pb-16 pt-5 md:pb-24 md:pt-6">
    <ShopPageBanner
      :title="filters.sale ? 'ТОВАРЫ СО СКИДКОЙ' : 'КАТАЛОГ'"
      lead="Джинсы, шорты, юбки, комбинезоны и куртки из денима. Выбирай свою форму и цвет."
    />

    <div class="mt-8 grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10">
      <CatalogSidebar v-model="categoryModel" />
      <div class="min-w-0">
        <p v-if="catalogStatus === 'pending' && !products.length" class="mb-4 text-sm text-ink/65">Загружаем каталог…</p>
        <CatalogSearch v-model="searchModel" />
        <CatalogMobileFilters v-model="filtersModel" v-model:category="categoryModel" :search="search" />
        <CatalogFilters v-model="filtersModel" @reset="resetFilters" />
        <div id="catalog-results" ref="resultsHeading" class="mb-5 mt-8 flex scroll-mt-36 items-center justify-between gap-4 border-b border-seam pb-4">
          <h2 class="text-lg font-semibold text-ink">{{ search ? 'Результаты поиска' : categoryTitle }}</h2>
          <span class="text-sm text-ink/60">{{ productCount }}</span>
        </div>
        <template v-if="products.length">
          <CatalogGrid :products="products" />
          <CatalogPagination
            v-if="totalPages > 1"
            :page="currentPage"
            :total-pages="totalPages"
            :total-items="catalog?.total ?? 0"
            :page-size="pageSize"
            @update:page="selectPage"
          />
        </template>
        <p v-else-if="catalogStatus === 'error'" class="border border-seam bg-ice px-5 py-10 text-center text-sm text-ink/70">Не удалось загрузить каталог.</p>
        <div v-else-if="catalogStatus !== 'pending'" class="border border-seam bg-ice px-5 py-10 text-center sm:px-8">
          <p class="text-lg font-semibold text-ink">{{ search ? 'По вашему запросу ничего не найдено' : 'По выбранным параметрам товары не найдены' }}</p>
          <button type="button" class="shop-button-secondary mt-5" @click="resetAll">Сбросить поиск и фильтры</button>
        </div>
      </div>
    </div>
  </section>
</template>
