import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
}).openapi('HealthResponse')

export const readinessResponseSchema = z.object({
  status: z.enum(['ready', 'unavailable']),
}).openapi('ReadinessResponse')
