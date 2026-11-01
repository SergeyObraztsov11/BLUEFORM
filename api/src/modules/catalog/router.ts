import { Router } from 'express'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { catalogCategories } from '../../../../shared/catalog-categories.js'
import { database } from '../../database.js'
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
  router.get('/api/catalog/categories', async (_request, response) => {
    const categories = await database().category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { parent: { select: { slug: true } } },
    })
    const result = {
      items: categories.map(category => ({
        slug: category.slug,
        name: category.name,
        parent: category.parent?.slug ?? null,
        fit: catalogCategories.find(item => item.slug === category.slug)?.fit ?? null,
      })),
    }
    response.json(categoryListSchema.parse(result))
  })
  return { router, registry }
}
