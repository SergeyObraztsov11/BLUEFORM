import { metricsRegistry } from '../utils/metrics';

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', metricsRegistry.contentType);
  return metricsRegistry.metrics();
});
