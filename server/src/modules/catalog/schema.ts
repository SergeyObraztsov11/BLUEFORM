import { z } from 'zod';

export const categoryListSchema = z
  .object({
    items: z.array(
      z.object({
        slug: z.string(),
        name: z.string(),
        parent: z.string().nullable(),
        fit: z.string().nullable(),
      }),
    ),
  })
  .openapi('CategoryList');

export const productSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    image: z.string().optional(),
    imageKind: z.enum(['fabric', 'product']).optional(),
    category: z.enum(['women', 'men']),
    categorySlug: z.string(),
    shade: z.string(),
    sizes: z.array(z.object({ code: z.string(), stock: z.number() })),
    fit: z.string(),
    price: z.number(),
    oldPrice: z.number().optional(),
    description: z.string().optional(),
    model: z.object({ heightCm: z.number(), size: z.string(), weightKg: z.number().optional() }).optional(),
  })
  .openapi('CatalogProduct');

export const productPageSchema = z
  .object({
    items: z.array(productSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  })
  .openapi('CatalogPage');

export const catalogErrorSchema = z
  .object({
    error: z.literal(true),
    code: z.string(),
    statusCode: z.number(),
    message: z.string(),
  })
  .openapi('CatalogError');
