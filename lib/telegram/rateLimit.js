const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const cache = new Map();

export function checkRateLimit(telegramUserId) {
  const now = Date.now();
  const key = String(telegramUserId);
  let entry = cache.get(key);

  if (!entry || now - entry.start > WINDOW_MS) {
    entry = { start: now, count: 0 };
    cache.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, retryAfterSec: Math.ceil((WINDOW_MS - (now - entry.start)) / 1000) };
  }
  return { allowed: true };
}
