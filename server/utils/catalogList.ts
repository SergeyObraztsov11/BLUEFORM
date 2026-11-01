import { categoryIncludes } from '../../app/data/catalog-categories'
import { apiError } from './http'
import type { CatalogCard } from './catalog'

export const CATALOG_PAGE_SIZE = 8

function strings(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(strings)
  if (typeof value !== 'string') return []
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

function first(value: unknown) {
  return strings(value)[0] ?? ''
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU').replaceAll('ё', 'е')
}

function readSort(value: unknown) {
  const sort = first(value)
  if (!sort || sort === 'default') return 'default'
  if (sort === 'price-asc' || sort === 'price-desc') return sort
  apiError('CATALOG_INVALID_SORT')
}

function readPage(value: unknown) {
  const page = first(value)
  if (!page) return 1
  if (!/^[1-9]\d{0,4}$/.test(page)) apiError('CATALOG_INVALID_PAGE')
  return Number(page)
}

function readPrice(value: unknown) {
  const price = first(value)
  if (!price) return null
  if (!/^\d{1,7}$/.test(price)) apiError('CATALOG_INVALID_PRICE')
  return Number(price)
}

export function catalogPage(cards: CatalogCard[], query: Record<string, unknown>) {
  const sort = readSort(query.sort)
  const page = readPage(query.page)
  const minimum = readPrice(query.minPrice)
  const maximum = readPrice(query.maxPrice)
  if (minimum !== null && maximum !== null && minimum > maximum) apiError('CATALOG_INVALID_PRICE')

  const category = first(query.category) || 'all'
  const shades = new Set(strings(query.shade))
  const sizes = strings(query.size)
  const freeFit = first(query.fit) === 'free'
  const sale = first(query.sale) === '1'
  const inStock = first(query.stock) === '1'
  const terms = normalize(first(query.q)).slice(0, 100).split(/\s+/).filter(Boolean)

  const result = cards.filter((card) => {
    const searchable = normalize(`${card.name} ${card.shade} ${card.fit}`)
    if (terms.some(term => !searchable.includes(term))) return false
    if (!categoryIncludes(category, card.categorySlug)) return false
    if (shades.size && !shades.has(card.shade)) return false
    if (sizes.length && !sizes.some(size => card.sizes.some(item => item.code === size))) return false
    if (freeFit && card.fit !== 'Свободный') return false
    if (sale && !(card.oldPrice != null && card.oldPrice > card.price)) return false
    if (inStock && !card.sizes.some(item => item.stock > 0 && (!sizes.length || sizes.includes(item.code)))) return false
    if (minimum !== null && card.price < minimum) return false
    if (maximum !== null && card.price > maximum) return false
    return true
  })

  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)

  const pageCount = Math.max(1, Math.ceil(result.length / CATALOG_PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * CATALOG_PAGE_SIZE
  return {
    items: result.slice(start, start + CATALOG_PAGE_SIZE),
    total: result.length,
    page: safePage,
    pageSize: CATALOG_PAGE_SIZE,
  }
}
