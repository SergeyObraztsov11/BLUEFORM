import type { CatalogPage } from '~/data/catalog'
import { requestHeaders } from '~/utils/apiError'
import { catalogQuerySignature } from '~/utils/catalogQuery'

export function useCatalogProducts() {
  const route = useRoute()
  const queryKey = computed(() => catalogQuerySignature(route.query))
  return useAsyncData('catalog-products', () => $fetch<CatalogPage>('/api/catalog/products', {
    query: route.query,
    headers: requestHeaders(),
  }), {
    watch: [queryKey],
    default: () => ({ items: [], total: 0, page: 1, pageSize: 8 }),
  })
}
