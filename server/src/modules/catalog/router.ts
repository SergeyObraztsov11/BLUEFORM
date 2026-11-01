import { Router } from 'express'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { getCategories } from './controller.js'
import { categoryListSchema } from './schema.js'

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
  return { router, registry }
}
