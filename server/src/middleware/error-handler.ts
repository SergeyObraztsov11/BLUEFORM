import type { ErrorRequestHandler } from 'express';
import { ApiError } from './api-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
    response
      .status(error.status)
      .json({ error: true, code: error.code, statusCode: error.status, message: error.message });
    return;
  }
  if (error?.type === 'entity.parse.failed') {
    response.status(400).json({ error: true, code: 'INVALID_JSON', message: 'Некорректный JSON.' });
    return;
  }
  if (error?.type === 'entity.too.large') {
    response.status(413).json({ error: true, code: 'BODY_TOO_LARGE', message: 'Запрос слишком большой.' });
    return;
  }
  console.error('API request failed', error);
  response.status(500).json({ error: true, code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера.' });
};
