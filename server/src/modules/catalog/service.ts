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
    where: { id, ...publishedColorwayWhere },
    include: colorwayInclude,
  });
  const card = colorway && toCatalogCard(colorway);
  if (!card) apiError('PRODUCT_NOT_FOUND');
  return card;
}
