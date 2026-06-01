/**
 * CORS helper for Next.js API route handlers.
 *
 * Usage in a route:
 *   const corsRes = handleCors(req)
 *   if (corsRes) return corsRes   // handles OPTIONS preflight
 *
 *   const res = NextResponse.json(data)
 *   addCorsHeaders(req, res)
 *   return res
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllowedOrigins } from './env'

const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With'

function resolveOrigin(requestOrigin: string | null): string {
  const allowed = getAllowedOrigins()
  if (requestOrigin && allowed.has(requestOrigin)) return requestOrigin
  // Fall back to the primary origin (never '*' for credentialed requests)
  return [...allowed][0] ?? 'null'
}

/** Returns CORS headers for the given request origin. */
function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = resolveOrigin(req.headers.get('origin'))
  return {
    'Access-Control-Allow-Origin':      origin,
    'Access-Control-Allow-Methods':     ALLOWED_METHODS,
    'Access-Control-Allow-Headers':     ALLOWED_HEADERS,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age':           '86400',
    'Vary':                             'Origin',
  }
}

/**
 * Handle a CORS preflight (OPTIONS) request.
 * Returns a 204 response if this is an OPTIONS request, otherwise null.
 */
export function handleCors(req: NextRequest): NextResponse | null {
  if (req.method !== 'OPTIONS') return null
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

/**
 * Append CORS headers to any existing NextResponse.
 */
export function addCorsHeaders(req: NextRequest, res: NextResponse): NextResponse {
  const headers = corsHeaders(req)
  for (const [key, val] of Object.entries(headers)) {
    res.headers.set(key, val)
  }
  return res
}
