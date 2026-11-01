import { consumeAdminLoginAttempt } from '../utils/adminRateLimit';
import { apiError } from '../utils/http';

export default defineEventHandler((event) => {
  if (event.method !== 'POST') return;
  const path = getRequestURL(event).pathname;
  if (path !== '/api/auth/sign-in/email') return;

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const limit = consumeAdminLoginAttempt(`signin:${ip}`);
  if (!limit.allowed) {
    setHeader(event, 'Retry-After', String(limit.retryAfterSec));
    apiError('ADMIN_LOGIN_RATE_LIMIT');
  }
});
