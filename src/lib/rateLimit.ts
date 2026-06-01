/**
 * In-memory sliding-window rate limiter.
 *
 * Works correctly in the custom server (single Node process).
 * For multi-instance / serverless deployments replace the store
 * with Upstash Redis or Vercel KV.
 *
 * Usage:
 *   const result = rateLimit(`login:${ip}`, { max: 5, windowMs: 15 * 60_000 })
 *   if (!result.ok) return rateLimitResponse(result)
 */

import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

interface Window { hits: number[] }

// Survive hot-module reloads in development
const globalStore = globalThis as { _rl?: Map<string, Window> }
if (!globalStore._rl) {
  globalStore._rl = new Map()
  // Prune expired entries every 5 minutes
  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, w] of globalStore._rl!) {
      if (!w.hits.length || now - w.hits[w.hits.length - 1]! > 30 * 60_000) {
        globalStore._rl!.delete(key)
      }
    }
  }, 5 * 60_000)
  // Prevent keeping the process alive solely for cleanup
  if (typeof cleanup.unref === 'function') cleanup.unref()
}
const store = globalStore._rl!

export interface RateLimitResult {
  ok:        boolean
  limit:     number
  remaining: number
  resetIn:   number   // ms until the oldest hit expires
}

/**
 * Sliding-window rate limit check.
 *
 * @param key       Unique identifier (e.g. `"login:192.168.1.1"`)
 * @param max       Maximum allowed hits in the window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): RateLimitResult {
  const now = Date.now()
  const w   = store.get(key) ?? { hits: [] }

  // Evict hits outside the current window
  w.hits = w.hits.filter((t) => now - t < windowMs)

  if (w.hits.length >= max) {
    const resetIn = windowMs - (now - (w.hits[0] ?? now))
    store.set(key, w)
    return { ok: false, limit: max, remaining: 0, resetIn }
  }

  w.hits.push(now)
  store.set(key, w)

  return {
    ok:        true,
    limit:     max,
    remaining: max - w.hits.length,
    resetIn:   windowMs,
  }
}

/** Build a 429 JSON response with standard rate-limit headers. */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const resetSec = Math.ceil(result.resetIn / 1000)
  return NextResponse.json(
    {
      error:   'Too many requests. Please wait before trying again.',
      retryIn: resetSec,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit':     String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset':     String(Math.ceil((Date.now() + result.resetIn) / 1000)),
        'Retry-After':           String(resetSec),
      },
    }
  )
}

/** Extract the best-available client IP from a NextRequest. */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    req.headers.get('cf-connecting-ip') ??   // Cloudflare
    'unknown'
  )
}

// ── Pre-defined rate-limit profiles ──────────────────────────────────────────

/** 5 attempts per 15 minutes — for login / register */
export const AUTH_LIMIT    = { max: 5,   windowMs: 15 * 60_000 }

/** 20 per hour — for creating new resources (businesses, connections) */
export const CREATE_LIMIT  = { max: 20,  windowMs: 60 * 60_000 }

/** 60 per minute — for messaging */
export const MESSAGE_LIMIT = { max: 60,  windowMs: 60_000 }

/** 100 per minute — general API reads */
export const READ_LIMIT    = { max: 100, windowMs: 60_000 }

/** 10 per 5 minutes — password-reset / sensitive ops */
export const STRICT_LIMIT  = { max: 10,  windowMs: 5 * 60_000 }
