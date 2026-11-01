import { Router } from 'express'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { healthResponseSchema } from './schema.js'

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

  return { router, registry }
}
