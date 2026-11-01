export interface CatalogCategoryNode {
  slug: string;
  name: string;
  parent: string | null;
  fit: string | null;
}

export function categoryBranchFrom(items: CatalogCategoryNode[], slug: string) {
  const branch: string[] = [];
  let current = items.find((item) => item.slug === slug);
  while (current) {
    branch.unshift(current.slug);
    const parent = current.parent;
    current = items.find((item) => item.slug === parent);
  }
  return branch;
}

export function useCatalogCategories() {
  return useAsyncData(
    'catalog-categories',
    () => $fetch<{ items: CatalogCategoryNode[] }>('/api/catalog/categories'),
    {
      default: () => ({ items: [] }),
    },
  );
}
