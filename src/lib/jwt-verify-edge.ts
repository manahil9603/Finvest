/**
 * Edge-safe JWT verification for Next.js middleware.
 *
 * `jsonwebtoken` (used in API routes) relies on Node APIs and is not reliable
 * in the Edge runtime — verification can fail and every protected page looks
 * unauthenticated. `jose` works on Edge and must stay in sync with `signToken`
 * in `@/lib/auth` (HS256, issuer, audience).
 */

import { jwtVerify } from 'jose'
import type { JWTPayload } from '@/lib/auth'

function secretKey() {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) return null
  return new TextEncoder().encode(s)
}

export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  const key = secretKey()
  if (!key) return null
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
      issuer:     'finvest',
      audience:   'finvest-app',
    })
    const userId = payload.userId
    const email  = payload.email
    const role   = payload.role
    if (typeof userId !== 'string' || typeof email !== 'string' || typeof role !== 'string') {
      return null
    }
    if (!userId || !email || !role) return null
    return { userId, email, role }
  } catch {
    return null
  }
}
