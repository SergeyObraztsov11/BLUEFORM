import { Router } from 'express';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { getCategories, getProducts, getProductById } from './controller.js';
import { catalogErrorSchema, categoryListSchema, productPageSchema, productSchema } from './schema.js';
import { database } from '../../database.js';
import path from 'node:path';

export function createCatalogModule() {
  const router = Router();
  const registry = new OpenAPIRegistry();
  router.get('/api/catalog/images/:id', async (req, res, next) => {
    try {
      const image = await database().productImage.findFirst({
        where: {
          mediaFileId: req.params.id,
          colorway: { status: 'PUBLISHED', product: { status: 'PUBLISHED' } },
        },
        include: { mediaFile: true },
      });
      const key = image?.mediaFile.storageKey;
      if (
        !image ||
        image.mediaFile.source !== 'DIRECTUS' ||
        !key ||
        !/^directus\/[a-f0-9-]+\.[a-z0-9]+$/i.test(key)
      )
        return res.sendStatus(404);
      const directory = process.env.DIRECTUS_SHOP_UPLOADS || '/directus-uploads';
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      });
      res.type(image.mediaFile.mimeType).sendFile(path.basename(key), { root: directory }, (error) => {
        if (error && !res.headersSent) next(error);
      });
    } catch (error) {
      next(error);
    }
  });
  registry.registerPath({
    method: 'get',
    path: '/api/catalog/categories',
    tags: ['Каталог'],
    summary: 'Получить категории каталога',
    responses: {
      200: {
        description: 'Активные категории',
        content: { 'application/json': { schema: categoryListSchema } },
      },
    },
  });
  router.get('/api/catalog/categories', getCategories);
  const queryValue = z.union([z.string(), z.array(z.string())]).optional();
  registry.registerPath({
    method: 'get',
    path: '/api/catalog/products',
    tags: ['Каталог'],
    summary: 'Получить товары каталога',
    request: {
      query: z.object({
        q: queryValue,
        category: queryValue,
        shade: queryValue,
        size: queryValue,
        fit: queryValue,
        sale: queryValue,
        stock: queryValue,
        minPrice: queryValue,
        maxPrice: queryValue,
        sort: queryValue,
        page: queryValue,
      }),
    },
    responses: {
      200: {
        description: 'Страница каталога',
        content: { 'application/json': { schema: productPageSchema } },
      },
      400: {
        description: 'Некорректные параметры',
        content: { 'application/json': { schema: catalogErrorSchema } },
      },
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/catalog/products/{id}',
    tags: ['Каталог'],
    summary: 'Получить товар',
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: 'Карточка товара', content: { 'application/json': { schema: productSchema } } },
      404: {
        description: 'Товар не найден',
        content: { 'application/json': { schema: catalogErrorSchema } },
      },
    },
  });
  router.get('/api/catalog/products', getProducts);
  router.get('/api/catalog/products/:id', getProductById);
  return { router, registry };
}
