import { openApi } from '../utils/openapi';

export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'application/json; charset=utf-8');
  return openApi;
});
