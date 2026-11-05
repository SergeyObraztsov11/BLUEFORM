import { randomUUID } from 'node:crypto';
import path from 'node:path';

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

export default {
  id: 'blueform-editor',
  handler(router, { database: db, logger }) {
    router.use((req, res, next) => {
      if (!req.accountability?.admin)
        return res.status(403).json({ message: 'Доступ только для администратора' });
      next();
    });

    router.get('/data', async (_req, res, next) => {
      try {
        const [products, categories, fabrics, systems, sizes, stock, images] = await Promise.all([
          db('products').select('id', 'name', 'status').orderBy('name'),
          db('categories')
            .select('id', 'name', 'slug', 'parentId')
            .where('isActive', true)
            .orderBy('sortOrder'),
          db('fabrics').select('id', 'colorName', 'colorHex').where('isActive', true).orderBy('colorName'),
          db('size_systems').select('id', 'name'),
          db('sizes').select('id', 'code', 'systemId').orderBy('sortOrder'),
          db('product_colorways as c')
            .join('skus as s', 's.colorwayId', 'c.id')
            .where('s.isActive', true)
            .groupBy('c.productId')
            .select('c.productId')
            .sum({ quantity: 's.stockQuantity' })
            .min({ price: 's.priceKopecks' }),
          db('product_colorways as c')
            .join('product_images as i', 'i.colorwayId', 'c.id')
            .join('media_files as m', 'm.id', 'i.mediaFileId')
            .select('c.productId', 'm.id as mediaId', 'm.source', 'm.storageKey')
            .orderBy('i.sortOrder'),
        ]);
        for (const product of products) {
          const summary = stock.find((item) => item.productId === product.id);
          product.stock = Number(summary?.quantity || 0);
          product.price = summary?.price == null ? null : Number(summary.price) / 100;
          product.image = images.find((item) => item.productId === product.id) || null;
        }
        res.json({ products, categories, fabrics, systems, sizes });
      } catch (error) {
        next(error);
      }
    });

    router.get('/products/:id', async (req, res, next) => {
      try {
        const product = await db('products').where('id', req.params.id).first();
        if (!product) return res.status(404).json({ message: 'Товар не найден' });
        const colors = await db('product_colorways').where('productId', product.id).orderBy('createdAt');
        for (const color of colors) {
          color.skus = await db('skus').where('colorwayId', color.id);
          color.images = await db('product_images as i')
            .join('media_files as m', 'm.id', 'i.mediaFileId')
            .where('i.colorwayId', color.id)
            .select('i.id', 'i.alt', 'i.kind', 'm.id as mediaId', 'm.source', 'm.storageKey')
            .orderBy('i.sortOrder');
        }
        res.json({ ...product, colors });
      } catch (error) {
        next(error);
      }
    });

    router.get('/static/:id', async (req, res, next) => {
      try {
        const media = await db('media_files').where({ id: req.params.id, source: 'STATIC' }).first();
        if (!media || !/^images\/[a-z0-9._-]+$/i.test(media.storageKey)) return res.sendStatus(404);
        res.set('X-Content-Type-Options', 'nosniff');
        res.type(media.mimeType).sendFile(media.storageKey, { root: '/blueform-static' }, (error) => {
          if (error && !res.headersSent) next(error);
        });
      } catch (error) {
        next(error);
      }
    });

    router.post('/products', async (req, res, next) => {
      try {
        const input = req.body;
        if (!input || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 200)
          invalid('Укажите название товара');
        if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(input.status)) invalid('Укажите статус товара');
        if (!Array.isArray(input.colors) || input.colors.length > 30) invalid('Проверьте цвета товара');
        if (
          input.status === 'PUBLISHED' &&
          !input.colors.some((c) => c.status === 'PUBLISHED' && c.skus?.some((s) => s.isActive))
        )
          invalid('Добавьте опубликованный цвет и хотя бы один размер');
        const id = await db.transaction(async (tx) => {
          const category = await tx('categories').where({ id: input.categoryId, isActive: true }).first();
          const system = await tx('size_systems').where('id', input.sizeSystemId).first();
          if (!category || !system) invalid('Выберите категорию и размерную сетку');
          const record = {
            name: input.name.trim(),
            description: input.description || null,
            categoryId: category.id,
            sizeSystemId: system.id,
            status: input.status,
          };
          let productId = input.id;
          let wasPublished = false;
          if (productId) {
            const current = await tx('products').where('id', productId).forUpdate().first();
            if (!current) invalid('Товар не найден');
            wasPublished = current.status === 'PUBLISHED';
            if (current.sizeSystemId !== system.id)
              invalid('Для существующего товара нельзя изменить размерную сетку');
            await tx('products').where('id', productId).update(record);
          } else {
            [productId] = (await tx('products').insert(record).returning('id')).map((row) => row.id);
          }
          const seenColors = new Set();
          for (const color of input.colors) {
            if (!color.fabricId || seenColors.has(color.fabricId))
              invalid('Каждый цвет можно добавить только один раз');
            seenColors.add(color.fabricId);
            if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(color.status)) invalid('Проверьте статус цвета');
            if (
              !Array.isArray(color.skus) ||
              color.skus.length > 100 ||
              !Array.isArray(color.images) ||
              color.images.length > 30
            )
              invalid('Проверьте размеры и фотографии');
            let colorId = color.id;
            let previousColor;
            if (colorId) {
              previousColor = await tx('product_colorways').where({ id: colorId, productId }).first();
              if (!previousColor || previousColor.fabricId !== color.fabricId)
                invalid('Нельзя заменить цвет существующего варианта');
              await tx('product_colorways').where('id', colorId).update({ status: color.status });
            } else {
              if (!(await tx('fabrics').where({ id: color.fabricId, isActive: true }).first()))
                invalid('Выберите цвет');
              [colorId] = (
                await tx('product_colorways')
                  .insert({ productId, fabricId: color.fabricId, status: color.status })
                  .returning('id')
              ).map((row) => row.id);
            }
            const existingImages = await tx('product_images').where('colorwayId', colorId).select('id');
            const alreadyPublishedWithoutPhotos =
              wasPublished && previousColor?.status === 'PUBLISHED' && existingImages.length === 0;
            if (
              input.status === 'PUBLISHED' &&
              color.status === 'PUBLISHED' &&
              (!color.skus.some((s) => s.isActive) ||
                (!color.images.length && !alreadyPublishedWithoutPhotos))
            )
              invalid('Для опубликованного цвета добавьте фотографию и размер');
            const seenSizes = new Set();
            for (const sku of color.skus) {
              if (seenSizes.has(sku.sizeId)) invalid('Размер повторяется');
              seenSizes.add(sku.sizeId);
              if (
                !Number.isInteger(sku.priceKopecks) ||
                sku.priceKopecks <= 0 ||
                sku.priceKopecks > 2147483647 ||
                !Number.isInteger(sku.stockQuantity) ||
                sku.stockQuantity < 0 ||
                sku.stockQuantity > 2147483647
              )
                invalid('Проверьте цену и остаток');
              if (
                sku.oldPriceKopecks !== null &&
                (!Number.isInteger(sku.oldPriceKopecks) ||
                  sku.oldPriceKopecks <= sku.priceKopecks ||
                  sku.oldPriceKopecks > 2147483647)
              )
                invalid('Старая цена должна быть больше текущей');
              if (!(await tx('sizes').where({ id: sku.sizeId, systemId: system.id }).first()))
                invalid('Размер не относится к размерной сетке товара');
              const values = {
                priceKopecks: sku.priceKopecks,
                oldPriceKopecks: sku.oldPriceKopecks,
                isActive: Boolean(sku.isActive),
              };
              if (sku.id) {
                const current = await tx('skus')
                  .where({ id: sku.id, colorwayId: colorId, sizeId: sku.sizeId })
                  .forUpdate()
                  .first();
                if (!current) invalid('Размер товара не найден');
                if (sku.stockQuantity !== sku.originalStock) {
                  if (current.stockQuantity !== sku.originalStock) {
                    const e = new Error(
                      'Остаток изменился во время редактирования. Обновите страницу и повторите изменение.',
                    );
                    e.status = 409;
                    throw e;
                  }
                  values.stockQuantity = sku.stockQuantity;
                }
                await tx('skus').where('id', sku.id).update(values);
              } else {
                await tx('skus').insert({
                  ...values,
                  colorwayId: colorId,
                  sizeId: sku.sizeId,
                  stockQuantity: sku.stockQuantity,
                });
              }
            }
            const kept = [];
            for (const [index, image] of color.images.entries()) {
              if (image.id) {
                if (!existingImages.some((entry) => entry.id === image.id))
                  invalid('Фотография не относится к этому товару');
                kept.push(image.id);
                await tx('product_images').where('id', image.id).update({ sortOrder: index });
              } else {
                const file = await tx('directus_files').where('id', image.fileId).first();
                if (
                  !file ||
                  file.storage !== 'local' ||
                  !['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(file.type) ||
                  Number(file.filesize) > 2147483647 ||
                  !/^[a-f0-9-]+\.[a-z0-9]+$/i.test(file.filename_disk)
                )
                  invalid('Выберите фотографию в формате JPEG, PNG, WebP, AVIF или GIF');
                const mediaId = randomUUID();
                const imageId = randomUUID();
                await tx('media_files').insert({
                  id: mediaId,
                  source: 'DIRECTUS',
                  storageKey: `directus/${file.filename_disk}`,
                  mimeType: file.type,
                  sizeBytes: file.filesize,
                });
                await tx('product_images').insert({
                  id: imageId,
                  colorwayId: colorId,
                  mediaFileId: mediaId,
                  kind: 'PRODUCT',
                  alt: input.name.trim(),
                  sortOrder: index,
                });
                kept.push(imageId);
              }
            }
            if (existingImages.length)
              await tx('product_images').where('colorwayId', colorId).whereNotIn('id', kept).delete();
          }
          return productId;
        });
        res.json({ id });
      } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        logger.error(error, 'Failed to save catalog product');
        next(error);
      }
    });
  },
};
