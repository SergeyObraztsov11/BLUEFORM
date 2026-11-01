export const catalogCategories = [
  { slug: 'women', name: 'Женщинам', parent: null, fit: null },
  { slug: 'women-jeans', name: 'Джинсы', parent: 'women', fit: null },
  { slug: 'women-jeans-straight', name: 'Прямые', parent: 'women-jeans', fit: 'Прямой' },
  { slug: 'women-jeans-loose', name: 'Свободные', parent: 'women-jeans', fit: 'Свободный' },
  { slug: 'women-jeans-wide', name: 'Широкие', parent: 'women-jeans', fit: 'Широкий' },
  { slug: 'women-jeans-flared', name: 'Клёш', parent: 'women-jeans', fit: 'Клёш' },
  { slug: 'women-shorts', name: 'Шорты', parent: 'women', fit: null },
  { slug: 'women-shorts-short', name: 'Короткие', parent: 'women-shorts', fit: 'Короткий' },
  { slug: 'women-shorts-bermuda', name: 'Бермуды', parent: 'women-shorts', fit: 'Бермуды' },
  { slug: 'women-skirts', name: 'Юбки', parent: 'women', fit: null },
  { slug: 'women-skirts-mini', name: 'Мини', parent: 'women-skirts', fit: 'Мини' },
  { slug: 'women-skirts-midi', name: 'Миди', parent: 'women-skirts', fit: 'Миди' },
  { slug: 'women-overalls', name: 'Комбинезоны', parent: 'women', fit: 'Свободный' },
  { slug: 'women-jackets', name: 'Джинсовые куртки', parent: 'women', fit: null },
  { slug: 'women-jackets-cropped', name: 'Укороченные', parent: 'women-jackets', fit: 'Укороченный' },
  { slug: 'women-jackets-loose', name: 'Свободные', parent: 'women-jackets', fit: 'Свободный' },
  { slug: 'men', name: 'Мужчинам', parent: null, fit: null },
  { slug: 'men-jeans', name: 'Джинсы', parent: 'men', fit: null },
  { slug: 'men-jeans-straight', name: 'Прямые', parent: 'men-jeans', fit: 'Прямой' },
  { slug: 'men-jeans-loose', name: 'Свободные', parent: 'men-jeans', fit: 'Свободный' },
  { slug: 'men-jeans-tapered', name: 'Зауженные', parent: 'men-jeans', fit: 'Зауженный' },
  { slug: 'men-shorts', name: 'Шорты', parent: 'men', fit: null },
  { slug: 'men-shorts-knee', name: 'До колена', parent: 'men-shorts', fit: 'До колена' },
  { slug: 'men-shorts-bermuda', name: 'Бермуды', parent: 'men-shorts', fit: 'Бермуды' },
  { slug: 'men-jackets', name: 'Джинсовые куртки', parent: 'men', fit: null },
  { slug: 'men-jackets-classic', name: 'Классические', parent: 'men-jackets', fit: 'Классический' },
  { slug: 'men-jackets-loose', name: 'Свободные', parent: 'men-jackets', fit: 'Свободный' },
] as const;

export type CatalogCategorySlug = (typeof catalogCategories)[number]['slug'];
export type CatalogAudience = 'women' | 'men';

export function categoryBranch(slug: string): string[] {
  const branch: string[] = [];
  let current = catalogCategories.find((category) => category.slug === slug);
  while (current) {
    branch.unshift(current.slug);
    current = catalogCategories.find((category) => category.slug === current?.parent);
  }
  return branch;
}

export function categoryIncludes(selected: string, leaf: string): boolean {
  return selected === 'all' || categoryBranch(leaf).includes(selected);
}
