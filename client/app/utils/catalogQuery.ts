import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import { emptyCatalogFilters, fabrics, russianSizes } from '~/data/catalog'
import { catalogCategories } from '~/data/catalog-categories'
import type { CatalogCategory, CatalogFilterState, CatalogSort } from '~/data/catalog'

const filterKeys = ['category', 'shade', 'size', 'fit', 'sale', 'stock', 'minPrice', 'maxPrice', 'sort', 'page', 'q'] as const

function queryValues(value: LocationQuery[string] | undefined) {
  return (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string')
}

function firstQueryValue(value: LocationQuery[string] | undefined) {
  return queryValues(value)[0] ?? ''
}

function priceValue(value: LocationQuery[string] | undefined) {
  const price = firstQueryValue(value)
  return /^\d{1,9}$/.test(price) ? price : ''
}

export function parseCatalogQuery(query: LocationQuery): { category: CatalogCategory, filters: CatalogFilterState, page: number, search: string } {
  const rawCategory = firstQueryValue(query.category)
  const category: CatalogCategory = (catalogCategories.some(item => item.slug === rawCategory) ? rawCategory : 'all') as CatalogCategory
  const shadeValues = new Set(queryValues(query.shade))
  const sizeValues = new Set(queryValues(query.size))
  const rawSort = firstQueryValue(query.sort)
  const sort: CatalogSort = rawSort === 'price-asc' || rawSort === 'price-desc' ? rawSort : 'default'
  const minPrice = priceValue(query.minPrice)
  const maxPrice = priceValue(query.maxPrice)
  const rawPage = firstQueryValue(query.page)
  const page = /^[1-9]\d{0,4}$/.test(rawPage) ? Number(rawPage) : 1

  return {
    category,
    page,
    search: firstQueryValue(query.q).trim().slice(0, 100),
    filters: {
      ...emptyCatalogFilters(),
      shades: fabrics.filter(fabric => shadeValues.has(fabric.name)).map(fabric => fabric.name),
      sizes: russianSizes.filter(size => sizeValues.has(size)),
      sale: firstQueryValue(query.sale) === '1',
      inStock: firstQueryValue(query.stock) === '1',
      minPrice,
      maxPrice: minPrice && maxPrice && Number(maxPrice) < Number(minPrice) ? '' : maxPrice,
      sort,
    },
  }
}

export function buildCatalogQuery(baseQuery: LocationQuery, category: CatalogCategory, filters: CatalogFilterState, page = 1, search = ''): LocationQueryRaw {
  const query: LocationQueryRaw = { ...baseQuery }
  // Keys are restricted to the known catalogue filters above.
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  for (const key of filterKeys) delete query[key]

  if (category !== 'all') query.category = category
  if (filters.shades.length) query.shade = filters.shades
  if (filters.sizes.length) query.size = filters.sizes
  if (filters.sale) query.sale = '1'
  if (filters.inStock) query.stock = '1'
  if (filters.minPrice) query.minPrice = filters.minPrice
  if (filters.maxPrice) query.maxPrice = filters.maxPrice
  if (filters.sort !== 'default') query.sort = filters.sort
  if (page > 1) query.page = String(page)
  if (search.trim()) query.q = search.trim()

  return query
}

export function catalogQuerySignature(query: LocationQuery | LocationQueryRaw) {
  return JSON.stringify(Object.keys(query).sort().map(key => {
    const value = query[key]
    const values = Array.isArray(value) ? value : [value]
    return [key, values.map(item => item == null ? null : String(item))]
  }))
}
