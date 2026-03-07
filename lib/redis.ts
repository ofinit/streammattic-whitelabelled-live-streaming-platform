import { Redis } from '@upstash/redis'

// Initialize Redis client gracefully so it doesn't crash if the env variables are missing
export const redisUrl = process.env.UPSTASH_REDIS_REST_URL
export const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

export const redis = redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null

/**
 * Execute a function and cache its output in Redis.
 * If Redis is not configured or fails, it gracefully falls back to the database.
 */
export async function withRedisCache<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    if (!redis) {
        return fetchFn()
    }

    try {
        const cached = await redis.get<T>(key)
        if (cached !== null) {
            return cached
        }

        const data = await fetchFn()
        if (data !== undefined) {
            await redis.set(key, data, { ex: ttlSeconds })
        }
        return data
    } catch (error) {
        console.error(`[Redis] Cache miss/error for key ${key}:`, error)
        return fetchFn()
    }
}

/**
 * Invalidate a specific cache key.
 */
export async function invalidateCache(key: string) {
    if (!redis) return
    try {
        await redis.del(key)
    } catch (error) {
        console.error(`[Redis] Invalidate error for key ${key}:`, error)
    }
}

/**
 * Invalidate multiple cache keys matching a pattern.
 */
export async function invalidateCachePattern(pattern: string) {
    if (!redis) return
    try {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
            await redis.del(...keys)
        }
    } catch (error) {
        console.error(`[Redis] Pattern invalidate error for ${pattern}:`, error)
    }
}
