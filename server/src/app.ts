import express from 'express';
import { apiReference } from '@scalar/express-api-reference';
import { extendZodWithOpenApi, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { toNodeHandler } from 'better-auth/node';
import { errorHandler } from './middleware/error-handler.js';
import { auth } from './modules/auth/auth.js';

extendZodWithOpenApi(z);

export async function createApp() {
  // Загрузка после расширения Zod позволяет схемам использовать .openapi().
  const { createHealthModule } = await import('./modules/health/router.js');
  const { createCatalogModule } = await import('./modules/catalog/router.js');
  const app = express();
  const modules = [createHealthModule(), createCatalogModule()];
  const generator = new OpenApiGeneratorV31(modules.flatMap((module) => module.registry.definitions));
  const specification = generator.generateDocument({
    openapi: '3.1.0',
    info: { title: 'BLUEFORM API', version: '0.1.0' },
  });

  app.disable('x-powered-by');
  app.get('/openapi.json', (_request, response) => response.json(specification));
  app.get(
    '/docs',
    apiReference({
      url: '/openapi.json',
      pageTitle: 'BLUEFORM API',
      cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.76.0',
      telemetry: false,
      withDefaultFonts: false,
    }),
  );
  app.all('/api/auth/*path', toNodeHandler(auth));
  app.use(express.json({ limit: '16kb' }));
  for (const module of modules) app.use(module.router);
  app.use(errorHandler);
  return app;
}
