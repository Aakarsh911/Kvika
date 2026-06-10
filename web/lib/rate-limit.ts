import { getRedisClient } from "@/lib/redis"

type RateLimitOptions = {
  /** Max requests allowed per window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
}

type RateLimitResult = {
  allowed: boolean
  retryAfterSeconds: number
}

// In-memory fallback when Redis is unavailable (per serverless instance).
const memoryBuckets = new Map<string, { count: number; resetAt: number }>()

function checkMemory(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const bucket = memoryBuckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + opts.windowSeconds * 1000 })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  bucket.count += 1
  if (bucket.count > opts.limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { allowed: true, retryAfterSeconds: 0 }
}

/**
 * Fixed-window rate limiter (Redis-backed, in-memory fallback).
 *
 * @param key unique limiter key, e.g. `ai:agent:user@example.com`
 */
export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`
  try {
    const client = await getRedisClient()
    if (!client) return checkMemory(key, opts)

    const count = await client.incr(redisKey)
    if (count === 1) {
      await client.expire(redisKey, opts.windowSeconds)
    }
    if (count > opts.limit) {
      const ttl = await client.ttl(redisKey)
      return { allowed: false, retryAfterSeconds: Math.max(ttl, 1) }
    }
    return { allowed: true, retryAfterSeconds: 0 }
  } catch {
    return checkMemory(key, opts)
  }
}
