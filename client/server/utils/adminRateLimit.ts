type Attempt = { count: number; resetAt: number };

const attempts = new Map<string, Attempt>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

export function consumeAdminLoginAttempt(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true as const, retryAfterSec: 0 };
  }
  if (current.count >= MAX_ATTEMPTS) {
    return {
      allowed: false as const,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { allowed: true as const, retryAfterSec: 0 };
}

export function clearAdminLoginAttempts(key: string) {
  attempts.delete(key);
}
