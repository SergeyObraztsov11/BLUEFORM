import { httpDuration, orderAttempts } from '../utils/metrics';

export default defineEventHandler((event) => {
  if (event.path.split('?')[0] === '/metrics') return;
  const stop = httpDuration.startTimer();
  event.node.res.once('finish', () => {
    const status = String(event.node.res.statusCode);
    stop({ method: event.method, status });
    if (event.method === 'POST' && event.path.split('?')[0] === '/api/orders') {
      orderAttempts.inc({ status });
    }
  });
});
