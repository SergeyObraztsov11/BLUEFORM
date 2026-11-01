import { readFile } from 'node:fs/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../client/server/generated/prisma/client';
import { fabrics, russianSizes } from '../client/app/data/catalog-options';
import { catalogCategories } from '../client/app/data/catalog-categories';

type TestProduct = {
  id: string;
  name: string;
  image?: string;
  category: 'women' | 'men';
  categorySlug: string;
  shade: string;
  sizes: string[];
  price: number;
  oldPrice?: number;
  description?: string;
  model?: { heightCm: number; weightKg?: number; size: string };
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to seed the catalog');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const products = JSON.parse(
  await readFile(new URL('../client/app/data/catalog-test.json', import.meta.url), 'utf8'),
) as TestProduct[];

try {
  const sizeSystem = await prisma.sizeSystem.upsert({
    where: { code: 'RU_CLOTHING' },
    update: { name: 'Российские размеры одежды' },
    create: { code: 'RU_CLOTHING', name: 'Российские размеры одежды' },
  });

  const sizeIds = new Map<string, string>();
  for (const [sortOrder, code] of russianSizes.entries()) {
    const size = await prisma.size.upsert({
      where: { systemId_code: { systemId: sizeSystem.id, code } },
      update: { sortOrder },
      create: { systemId: sizeSystem.id, code, sortOrder },
    });
    sizeIds.set(code, size.id);
  }

  const categoryIds = new Map<string, string>();
  for (const [sortOrder, category] of catalogCategories.entries()) {
    const parentId = category.parent ? categoryIds.get(category.parent) : null;
    if (category.parent && !parentId) throw new Error(`Missing parent category: ${category.parent}`);
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, parentId, sortOrder, isActive: true },
      create: { slug: category.slug, name: category.name, parentId, sortOrder, isActive: true },
    });
    categoryIds.set(category.slug, record.id);
  }

  const fabricIds = new Map<string, string>();
  const mediaIds = new Map<string, string>();
  for (const fabric of fabrics) {
    const storageKey = fabric.image.replace(/^\//, '');
    const code = storageKey
      .split('/')
      .at(-1)!
      .replace(/^denim-/, '')
      .replace(/\.webp$/, '');
    const media = await prisma.mediaFile.upsert({
      where: { source_storageKey: { source: 'STATIC', storageKey } },
      update: { mimeType: 'image/webp' },
      create: { source: 'STATIC', storageKey, mimeType: 'image/webp' },
    });
    const record = await prisma.fabric.upsert({
      where: { code },
      update: {
        name: fabric.name,
        colorName: fabric.name,
        colorHex: fabric.hex,
        colorGroup: ['sky', 'icy'].includes(code) ? 'Голубой' : 'Синий',
        textureFileId: media.id,
      },
      create: {
        code,
        name: fabric.name,
        colorName: fabric.name,
        colorHex: fabric.hex,
        colorGroup: ['sky', 'icy'].includes(code) ? 'Голубой' : 'Синий',
        textureFileId: media.id,
      },
    });
    fabricIds.set(fabric.name, record.id);
    mediaIds.set(storageKey, media.id);
  }

  const productIds = new Map<string, string>();
  for (const sample of products) {
    if (productIds.has(sample.categorySlug)) continue;
    const categoryId = categoryIds.get(sample.categorySlug);
    if (!categoryId || catalogCategories.some((category) => category.parent === sample.categorySlug))
      throw new Error(`Product must use a leaf category: ${sample.categorySlug}`);
    const legacyLoose =
      sample.categorySlug === 'women-jeans-loose' || sample.categorySlug === 'men-jeans-loose';
    const modelId = legacyLoose ? `bf-${sample.category}-loose-jeans` : `bf-model-${sample.categorySlug}`;
    const slug = legacyLoose ? `${sample.category}-loose-jeans` : sample.categorySlug;
    const model = await prisma.product.upsert({
      where: { slug },
      update: {
        categoryId,
        sizeSystemId: sizeSystem.id,
        name: sample.name,
        description: sample.description,
        status: 'PUBLISHED',
      },
      create: {
        id: modelId,
        categoryId,
        sizeSystemId: sizeSystem.id,
        name: sample.name,
        slug,
        description: sample.description,
        status: 'PUBLISHED',
      },
    });
    productIds.set(sample.categorySlug, model.id);
  }

  for (const product of products) {
    const fabricId = fabricIds.get(product.shade);
    if (!fabricId) throw new Error(`Unknown fabric: ${product.shade}`);
    const colorway = await prisma.productColorway.upsert({
      where: { id: product.id },
      update: {
        productId: productIds.get(product.categorySlug)!,
        fabricId,
        status: 'PUBLISHED',
        modelHeightCm: product.model?.heightCm,
        modelWeightKg: product.model?.weightKg,
        modelWornSizeCode: product.model?.size,
      },
      create: {
        id: product.id,
        productId: productIds.get(product.categorySlug)!,
        sizeSystemId: sizeSystem.id,
        fabricId,
        slug: product.id,
        status: 'PUBLISHED',
        modelHeightCm: product.model?.heightCm,
        modelWeightKg: product.model?.weightKg,
        modelWornSizeCode: product.model?.size,
      },
    });

    if (product.image) {
      const storageKey = product.image.replace(/^\//, '');
      const mediaFileId = mediaIds.get(storageKey);
      if (!mediaFileId) throw new Error(`Unknown media: ${storageKey}`);
      await prisma.productImage.upsert({
        where: { id: `${product.id}-texture` },
        update: { mediaFileId, alt: `Фактура денима: ${product.shade}` },
        create: {
          id: `${product.id}-texture`,
          colorwayId: colorway.id,
          mediaFileId,
          kind: 'TEXTURE',
          alt: `Фактура денима: ${product.shade}`,
        },
      });
    }

    for (const code of product.sizes) {
      const sizeId = sizeIds.get(code);
      if (!sizeId) throw new Error(`Unknown size: ${code}`);
      const skuCode = `${product.id}-${code}`.toUpperCase();
      await prisma.sku.upsert({
        where: { skuCode },
        update: {
          priceKopecks: product.price * 100,
          oldPriceKopecks: product.oldPrice ? product.oldPrice * 100 : null,
          stockQuantity: 10,
          isActive: true,
        },
        create: {
          colorwayId: colorway.id,
          sizeSystemId: sizeSystem.id,
          sizeId,
          skuCode,
          priceKopecks: product.price * 100,
          oldPriceKopecks: product.oldPrice ? product.oldPrice * 100 : null,
          stockQuantity: 10,
        },
      });
    }
  }

  console.log(`Seeded ${products.length} colorways and ${await prisma.sku.count()} SKUs`);
} finally {
  await prisma.$disconnect();
}
