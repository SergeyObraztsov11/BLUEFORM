import { Router } from 'express'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { getCategories, getProducts, getProductById } from './controller.js'
import { catalogErrorSchema, categoryListSchema, productPageSchema, productSchema } from './schema.js'

export function createCatalogModule() {
  const router = Router()
  const registry = new OpenAPIRegistry()
  registry.registerPath({
    method: 'get',
    path: '/api/catalog/categories',
    tags: ['Каталог'],
    summary: 'Получить категории каталога',
    responses: {
      200: { description: 'Активные категории', content: { 'application/json': { schema: categoryListSchema } } },
    },
  })
  router.get('/api/catalog/categories', getCategories)
  const queryValue = z.union([z.string(), z.array(z.string())]).optional()
  registry.registerPath({
    method: 'get', path: '/api/catalog/products', tags: ['Каталог'], summary: 'Получить товары каталога',
    request: { query: z.object({
      q: queryValue, category: queryValue, shade: queryValue, size: queryValue,
      fit: queryValue, sale: queryValue, stock: queryValue, minPrice: queryValue,
      maxPrice: queryValue, sort: queryValue, page: queryValue,
    }) },
    responses: {
      200: { description: 'Страница каталога', content: { 'application/json': { schema: productPageSchema } } },
      400: { description: 'Некорректные параметры', content: { 'application/json': { schema: catalogErrorSchema } } },
    },
  })
  registry.registerPath({
    method: 'get', path: '/api/catalog/products/{id}', tags: ['Каталог'], summary: 'Получить товар',
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: 'Карточка товара', content: { 'application/json': { schema: productSchema } } },
      404: { description: 'Товар не найден', content: { 'application/json': { schema: catalogErrorSchema } } },
    },
  })
  router.get('/api/catalog/products', getProducts)
  router.get('/api/catalog/products/:id', getProductById)
  return { router, registry }
}
