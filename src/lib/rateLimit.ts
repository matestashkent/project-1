interface RateLimitRecord {
  count: number;
  reset: number;
}

const store = new Map<string, RateLimitRecord>();

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store) {
    if (now > record.reset) store.delete(key);
  }
}, 10 * 60 * 1000);

export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60 * 60 * 1000
): boolean {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;

  record.count++;
  return true;
}
