import type { RequestHandler } from 'express';
import { categoryListSchema, productSchema, productPageSchema } from './schema.js';
import { getProduct, listCategories, listProducts } from './service.js';

export const getCategories: RequestHandler = async (_request, response) => {
  response.json(categoryListSchema.parse(await listCategories()));
};

export const getProducts: RequestHandler = async (request, response) => {
  response.json(productPageSchema.parse(await listProducts(request.query)));
};

export const getProductById: RequestHandler = async (request, response) => {
  response.json(productSchema.parse(await getProduct(String(request.params.id))));
};
