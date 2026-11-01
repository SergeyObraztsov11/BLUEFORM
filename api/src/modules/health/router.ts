import { Router } from 'express'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { database } from '../../database.js'
import { healthResponseSchema, readinessResponseSchema } from './schema.js'

export function createHealthModule() {
  const router = Router()
  const registry = new OpenAPIRegistry()

  registry.registerPath({
    method: 'get',
    path: '/api/health',
    tags: ['Состояние'],
    summary: 'Проверить доступность API',
    responses: {
      200: {
        description: 'API отвечает',
        content: { 'application/json': { schema: healthResponseSchema } },
      },
    },
  })

  router.get('/api/health', (_request, response) => {
    response.json(healthResponseSchema.parse({ status: 'ok' }))
  })

  registry.registerPath({
    method: 'get',
    path: '/api/ready',
    tags: ['Состояние'],
    summary: 'Проверить подключение к базе данных',
    responses: {
      200: { description: 'База доступна', content: { 'application/json': { schema: readinessResponseSchema } } },
      503: { description: 'База недоступна', content: { 'application/json': { schema: readinessResponseSchema } } },
    },
  })
  router.get('/api/ready', async (_request, response) => {
    try {
      await database().$queryRaw`SELECT 1`
      response.json(readinessResponseSchema.parse({ status: 'ready' }))
    } catch {
      response.status(503).json(readinessResponseSchema.parse({ status: 'unavailable' }))
    }
  })

  return { router, registry }
}
