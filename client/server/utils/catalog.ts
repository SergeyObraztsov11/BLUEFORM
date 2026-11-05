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
  images?: { src: string; kind: 'fabric' | 'product'; alt: string }[];
  category: 'women' | 'men';
  categorySlug: string;
  shade: string;
  shadeHex: string;
  sizes: { code: string; stock: number; price: number; oldPrice?: number }[];
  fit: string;
  price: number;
  priceFrom?: boolean;
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
  const availableSkus = skus.filter((sku) => sku.stockQuantity > 0);
  const displaySkus = availableSkus.length ? availableSkus : skus;
  const priced =
    priceSku ??
    displaySkus.reduce<(typeof skus)[number] | null>((best, sku) => {
      if (!best || sku.priceKopecks < best.priceKopecks) return sku;
      return best;
    }, null);
  if (!priced) return null;

  const images = colorway.images.filter(
    (item) =>
      item.mediaFile.source === 'STATIC' ||
      (item.mediaFile.source === 'DIRECTUS' && item.mediaFile.storageKey.startsWith('directus/')),
  );
  const image = images[0];
  const category = colorway.product.category as CategoryNode;
  const card: CatalogCard = {
    id: colorway.id,
    name: colorway.product.name,
    category: rootCategory(category),
    categorySlug: colorway.product.category.slug,
    shade: colorway.fabric.colorName,
    shadeHex: colorway.fabric.colorHex,
    sizes: skus.map((sku) => ({
      code: sku.size.code,
      stock: sku.stockQuantity,
      price: rubles(sku.priceKopecks),
      ...(sku.oldPriceKopecks != null ? { oldPrice: rubles(sku.oldPriceKopecks) } : {}),
    })),
    fit: fitOf(colorway.product.category.slug),
    price: rubles(priced.priceKopecks),
    priceFrom: new Set(displaySkus.map((sku) => sku.priceKopecks)).size > 1,
    description: colorway.product.description ?? undefined,
  };
  if (priced.oldPriceKopecks != null && priced.oldPriceKopecks > priced.priceKopecks)
    card.oldPrice = rubles(priced.oldPriceKopecks);
  if (image) {
    card.image =
      image.mediaFile.source === 'STATIC'
        ? `/${image.mediaFile.storageKey.replace(/^\//, '')}`
        : `/api/catalog/images/${image.mediaFile.id}`;
    card.imageKind = image.kind === 'TEXTURE' ? 'fabric' : 'product';
    card.images = images.map((item) => ({
      src:
        item.mediaFile.source === 'STATIC'
          ? `/${item.mediaFile.storageKey.replace(/^\//, '')}`
          : `/api/catalog/images/${item.mediaFile.id}`,
      kind: item.kind === 'TEXTURE' ? 'fabric' : 'product',
      alt: item.alt,
    }));
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
