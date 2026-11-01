import type { RequestHandler } from 'express'
import { database } from '../../database.js'
import { healthResponseSchema, readinessResponseSchema } from './schema.js'

export const getHealth: RequestHandler = (_request, response) => {
  response.json(healthResponseSchema.parse({ status: 'ok' }))
}

export const getReadiness: RequestHandler = async (_request, response) => {
  try {
    await database().$queryRaw`SELECT 1`
    response.json(readinessResponseSchema.parse({ status: 'ready' }))
  } catch {
    response.status(503).json(readinessResponseSchema.parse({ status: 'unavailable' }))
  }
}
