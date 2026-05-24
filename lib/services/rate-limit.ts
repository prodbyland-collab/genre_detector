const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const max = Number(process.env.RATE_LIMIT_PER_HOUR ?? 25);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, count: 1 };
  }

  bucket.count += 1;
  return { allowed: bucket.count <= max, count: bucket.count };
}
