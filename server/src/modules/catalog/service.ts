import { catalogCategories } from '../../../../shared/catalog-categories.js';
import { database } from '../../database.js';
import { apiError } from '../../middleware/api-error.js';
import { colorwayInclude, publishedColorwayWhere, toCatalogCard } from './catalog.js';
import { catalogPage } from './catalog-list.js';

export async function listCategories() {
  const categories = await database().category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { parent: { select: { slug: true } } },
  });
  return {
    items: categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      parent: category.parent?.slug ?? null,
      fit: catalogCategories.find((item) => item.slug === category.slug)?.fit ?? null,
    })),
  };
}

export async function listOptions() {
  const colorways = await database().productColorway.findMany({
    where: { ...publishedColorwayWhere, skus: { some: { isActive: true } } },
    select: {
      fabric: { select: { colorName: true, colorHex: true } },
      product: { select: { name: true } },
      skus: { where: { isActive: true }, select: { size: { select: { code: true, sortOrder: true } } } },
    },
  });
  const colors = new Map(
    colorways.map(({ fabric }) => [fabric.colorName, { name: fabric.colorName, hex: fabric.colorHex }]),
  );
  const sizes = new Map(
    colorways.flatMap(({ skus }) => skus.map(({ size }) => [size.code, size.sortOrder] as const)),
  );
  return {
    colors: [...colors.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    sizes: [...sizes].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], 'ru')).map(([code]) => code),
    products: [...new Set(colorways.map(({ product }) => product.name))].sort((a, b) =>
      a.localeCompare(b, 'ru'),
    ),
  };
}

export async function listProducts(query: Record<string, unknown>) {
  const colorways = await database().productColorway.findMany({
    where: publishedColorwayWhere,
    include: colorwayInclude,
    orderBy: [
      { product: { category: { sortOrder: 'asc' } } },
      { product: { name: 'asc' } },
      { fabric: { colorName: 'asc' } },
    ],
  });
  const cards = colorways.flatMap((colorway) => {
    const card = toCatalogCard(colorway);
    return card ? [card] : [];
  });
  return catalogPage(cards, query);
}

export async function getProduct(id: string) {
  const colorway = await database().productColorway.findFirst({
    where: {
      id,
      status: { in: ['PUBLISHED', 'ARCHIVED'] },
      product: { status: { in: ['PUBLISHED', 'ARCHIVED'] } },
    },
    include: colorwayInclude,
  });
  const card = colorway && toCatalogCard(colorway);
  if (!card) apiError('PRODUCT_NOT_FOUND');
  if (colorway.status !== 'PUBLISHED' || colorway.product.status !== 'PUBLISHED') {
    card.sizes = card.sizes.map((size) => ({ ...size, stock: 0 }));
  }
  return card;
}
