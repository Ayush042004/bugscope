// Simple in-memory sliding window rate limiter.
// NOTE: For production scale move to Redis or durable KV.
export interface RateLimitOptions {
  windowMs: number; // e.g. 60000
  max: number; // allowed hits per window
  keyPrefix?: string;
}

interface Bucket { count: number; windowStart: number; }

const store = new Map<string, Bucket>();

export function rateLimit(key: string, opts: RateLimitOptions): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const bucketKey = `${opts.keyPrefix || 'rl'}:${key}`;
  const bucket = store.get(bucketKey);
  if (!bucket) {
    store.set(bucketKey, { count: 1, windowStart: now });
    return { allowed: true, remaining: opts.max - 1, resetIn: opts.windowMs };
  }
  if (now - bucket.windowStart > opts.windowMs) {
    bucket.count = 1;
    bucket.windowStart = now;
    return { allowed: true, remaining: opts.max - 1, resetIn: opts.windowMs };
  }
  bucket.count += 1;
  const allowed = bucket.count <= opts.max;
  return { allowed, remaining: Math.max(0, opts.max - bucket.count), resetIn: opts.windowMs - (now - bucket.windowStart) };
}
