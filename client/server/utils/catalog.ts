import { catalogCategories } from '../../app/data/catalog-categories';
import type { Prisma } from '../generated/prisma/client';

export const colorwayInclude = {
  product: { include: { category: { include: { parent: { include: { parent: true } } } } } },
  fabric: true,
  skus: { where: { isActive: true }, include: { size: true } },
  images: { orderBy: { sortOrder: 'asc' }, include: { mediaFile: true } },
} satisfies Prisma.ProductColorwayInclude;

export const publishedColorwayWhere = {
  status: 'PUBLISHED',
  product: { status: 'PUBLISHED' },
} satisfies Prisma.ProductColorwayWhereInput;

export type ColorwayRecord = Prisma.ProductColorwayGetPayload<{ include: typeof colorwayInclude }>;

type CategoryNode = { slug: string; parent: CategoryNode | null };

export type CatalogCard = {
  id: string;
  name: string;
  image?: string;
  imageKind?: 'fabric' | 'product';
  category: 'women' | 'men';
  categorySlug: string;
  shade: string;
  sizes: { code: string; stock: number }[];
  fit: string;
  price: number;
  oldPrice?: number;
  description?: string;
  model?: { heightCm: number; size: string; weightKg?: number };
};

export function rubles(kopecks: number) {
  return kopecks / 100;
}

function rootCategory(category: CategoryNode) {
  let current = category;
  while (current.parent) current = current.parent;
  return current.slug === 'men' ? 'men' : 'women';
}

function fitOf(slug: string) {
  return catalogCategories.find((category) => category.slug === slug)?.fit ?? '';
}

export function toCatalogCard(
  colorway: ColorwayRecord,
  priceSku?: ColorwayRecord['skus'][number],
): CatalogCard | null {
  const skus = [...colorway.skus].sort((a, b) => a.size.sortOrder - b.size.sortOrder);
  const priced =
    priceSku ??
    skus.reduce<(typeof skus)[number] | null>((best, sku) => {
      if (!best || sku.priceKopecks < best.priceKopecks) return sku;
      return best;
    }, null);
  if (!priced) return null;

  const image = colorway.images.find((item) => item.mediaFile.source === 'STATIC');
  const category = colorway.product.category as CategoryNode;
  const card: CatalogCard = {
    id: colorway.id,
    name: colorway.product.name,
    category: rootCategory(category),
    categorySlug: colorway.product.category.slug,
    shade: colorway.fabric.colorName,
    sizes: skus.map((sku) => ({ code: sku.size.code, stock: sku.stockQuantity })),
    fit: fitOf(colorway.product.category.slug),
    price: rubles(priced.priceKopecks),
    description: colorway.product.description ?? undefined,
  };
  if (priced.oldPriceKopecks != null && priced.oldPriceKopecks > priced.priceKopecks)
    card.oldPrice = rubles(priced.oldPriceKopecks);
  if (image) {
    card.image = `/${image.mediaFile.storageKey.replace(/^\//, '')}`;
    card.imageKind = image.kind === 'TEXTURE' ? 'fabric' : 'product';
  }
  if (colorway.modelHeightCm != null && colorway.modelWornSizeCode) {
    card.model = {
      heightCm: colorway.modelHeightCm,
      size: colorway.modelWornSizeCode,
      weightKg: colorway.modelWeightKg ?? undefined,
    };
  }
  return card;
}
