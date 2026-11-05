export interface CatalogOptions {
  colors: { name: string; hex: string }[];
  sizes: string[];
  products: string[];
}

export function useCatalogOptions() {
  return useAsyncData('catalog-options', () => $fetch<CatalogOptions>('/api/catalog/options'), {
    default: () => ({ colors: [], sizes: [], products: [] }),
  });
}
