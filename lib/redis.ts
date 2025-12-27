import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GreenChainz Rate Limiter
 * Uses Upstash Redis to implement a "Token Bucket" or "Fixed Window" limit.
 */

export interface RateLimitConfig {
  limit: number      // Max requests
  window: number     // Time window in seconds
  identifier: string // Unique ID (IP address, User ID, or API Key)
}

export async function rateLimit(config: RateLimitConfig) {
  if (!redis) {
    // Fail open if Redis isn't configured so we don't break the app
    console.warn('Redis not configured, skipping rate limit')
    return { success: true, remaining: 100 }
  }

  const { limit, window, identifier } = config
  const key = `rate_limit:${identifier}`

  try {
    // Increment the counter for this identifier
    const requests = await redis.incr(key)

    // If this is the first request, set the expiry
    if (requests === 1) {
      await redis.expire(key, window)
    }

    const remaining = Math.max(0, limit - requests)
    
    return {
      success: requests <= limit,
      remaining,
      limit,
      window
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open on Redis error to maintain uptime
    return { success: true, remaining: 1 } 
  }
}

/**
 * Helper to get IP from request
 */
export function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') ?? '127.0.0.1'
}
