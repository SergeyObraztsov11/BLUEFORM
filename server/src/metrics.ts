import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry, prefix: 'blueform_' });
export const httpDuration = new Histogram({
  name: 'blueform_http_request_duration_seconds',
  help: 'HTTP request duration by method and status.',
  labelNames: ['method', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const mailAttempts = new Counter({
  name: 'blueform_mail_attempts_total',
  help: 'Mail delivery attempts by outcome.',
  labelNames: ['outcome'],
  registers: [metricsRegistry],
});
