import type { RequestHandler } from 'express'
import { categoryListSchema } from './schema.js'
import { listCategories } from './service.js'

export const getCategories: RequestHandler = async (_request, response) => {
  response.json(categoryListSchema.parse(await listCategories()))
}
