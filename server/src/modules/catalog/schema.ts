import { z } from 'zod'

export const categoryListSchema = z.object({
  items: z.array(z.object({
    slug: z.string(),
    name: z.string(),
    parent: z.string().nullable(),
    fit: z.string().nullable(),
  })),
}).openapi('CategoryList')
