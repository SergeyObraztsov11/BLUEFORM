import rawProducts from './catalog-test.json';
import { catalogCategories, categoryIncludes } from './catalog-categories';
import { fabrics, russianSizes } from './catalog-options';
import type { CatalogAudience, CatalogCategorySlug } from './catalog-categories';
import productPlaceholder from '~/assets/images/product-placeholder.webp';

export { fabrics, russianSizes };

export type CatalogCategory = string;
export type CatalogSort = 'default' | 'price-asc' | 'price-desc';

export interface CatalogFilterState {
  shades: string[];
  sizes: string[];
  sale: boolean;
  inStock: boolean;
  minPrice: string;
  maxPrice: string;
  sort: CatalogSort;
}

export interface CatalogSize {
  code: string;
  stock: number;
}

export interface CatalogPage {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  image?: string;
  imageKind?: 'fabric' | 'product';
  category: CatalogAudience;
  categorySlug: CatalogCategorySlug;
  shade: string;
  sizes: CatalogSize[];
  fit: string;
  price: number;
  oldPrice?: number;
  description?: string;
  model?: {
    heightCm: number;
    size: string;
    weightKg?: number;
  };
}

export const catalogProducts: CatalogProduct[] = rawProducts.map((product) => {
  const category = catalogCategories.find((item) => item.slug === product.categorySlug);
  if (!category?.fit) throw new Error(`Unknown product category: ${product.categorySlug}`);
  if (product.category !== 'women' && product.category !== 'men')
    throw new Error(`Unknown audience: ${product.category}`);
  if (product.imageKind !== undefined && product.imageKind !== 'fabric' && product.imageKind !== 'product') {
    throw new Error(`Unknown image kind: ${product.imageKind}`);
  }
  return {
    ...product,
    category: product.category,
    imageKind: product.imageKind,
    categorySlug: category.slug,
    fit: category.fit,
    sizes: product.sizes.map((code) => ({ code, stock: 0 })),
  };
});

export const productImage = (product: CatalogProduct) => product.image || productPlaceholder;
export const productImageAlt = (product: CatalogProduct) =>
  product.image
    ? product.imageKind === 'fabric'
      ? `Фактура ткани: ${product.shade}`
      : `${product.name}, цвет ${product.shade}`
    : 'Фотография товара пока отсутствует';
export const productCategoryName = (product: CatalogProduct) =>
  catalogCategories.find((category) => category.slug === product.categorySlug)?.name ?? '';

export function emptyCatalogFilters(): CatalogFilterState {
  return { shades: [], sizes: [], sale: false, inStock: false, minPrice: '', maxPrice: '', sort: 'default' };
}

export function filterCatalogProducts(
  products: CatalogProduct[],
  category: CatalogCategory,
  filters: CatalogFilterState,
  search = '',
) {
  const minimum = filters.minPrice === '' ? null : Number(filters.minPrice);
  const maximum = filters.maxPrice === '' ? null : Number(filters.maxPrice);
  const searchTerms = search
    .trim()
    .toLocaleLowerCase('ru-RU')
    .replaceAll('ё', 'е')
    .split(/\s+/)
    .filter(Boolean);

  const result = products.filter((product) => {
    const searchable = `${product.name} ${product.shade} ${product.fit}`
      .toLocaleLowerCase('ru-RU')
      .replaceAll('ё', 'е');
    if (searchTerms.some((term) => !searchable.includes(term))) return false;
    if (!categoryIncludes(category, product.categorySlug)) return false;
    if (filters.shades.length && !filters.shades.includes(product.shade)) return false;
    if (
      filters.sizes.length &&
      !filters.sizes.some((size) => product.sizes.some((item) => item.code === size))
    )
      return false;
    if (filters.sale && !(product.oldPrice != null && product.oldPrice > product.price)) return false;
    if (
      filters.inStock &&
      !product.sizes.some(
        (item) => item.stock > 0 && (!filters.sizes.length || filters.sizes.includes(item.code)),
      )
    )
      return false;
    if (minimum !== null && product.price < minimum) return false;
    if (maximum !== null && product.price > maximum) return false;
    return true;
  });

  if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  return result;
}
