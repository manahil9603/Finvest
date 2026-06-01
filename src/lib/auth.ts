import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, JWT_EXPIRY_SECONDS } from './constants'

// ── Secret validation ─────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is not set. ' +
    'Add it to .env.local (development) or your production secrets.'
  )
}

if (JWT_SECRET.length < 32) {
  const msg =
    `JWT_SECRET is too short (${JWT_SECRET.length} chars). ` +
    'Use at least 32 characters for security.'

  if (process.env.NODE_ENV === 'production') throw new Error(msg)
  else console.warn(`⚠  ${msg}`)
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  userId: string
  email:  string
  role:   string
  iat?:   number
  exp?:   number
}

// ── Token operations ──────────────────────────────────────────────────────────

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: '7d',
    algorithm: 'HS256',
    // Audience and issuer provide additional validation layers
    audience:  'finvest-app',
    issuer:    'finvest',
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!, {
      algorithms: ['HS256'],
      audience:   'finvest-app',
      issuer:     'finvest',
    }) as JWTPayload

    // Extra: confirm the payload has the fields we expect
    if (!payload.userId || !payload.email || !payload.role) return null

    return payload
  } catch {
    // Handles: expired, invalid signature, malformed, wrong algorithm, etc.
    return null
  }
}

// ── Cookie options ────────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   isProd,           // only HTTPS in production
  sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge:   JWT_EXPIRY_SECONDS,
  path:     '/',
}

/** Attach auth cookie to a NextResponse */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE, token, COOKIE_OPTIONS)
}

/** Clear auth cookie on a NextResponse */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE, '', {
    ...COOKIE_OPTIONS,
    maxAge:  0,
    expires: new Date(0),
  })
}

// ── Server-component helpers ──────────────────────────────────────────────────

/** Read current user in a Server Component or Route Handler (uses Next.js cookies API). */
export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

// ── Middleware / Route Handler helpers ────────────────────────────────────────

/**
 * Read current user from a NextRequest.
 * Supports both httpOnly cookie and Bearer token header (API clients).
 */
export function getAuthUserFromRequest(req: NextRequest): JWTPayload | null {
  // Prefer httpOnly cookie (web browser)
  const cookieToken = req.cookies.get(AUTH_COOKIE)?.value

  // Fall back to Authorization header (REST API clients / mobile)
  const bearerToken = req.headers.get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim()

  const token = cookieToken ?? bearerToken
  if (!token) return null

  return verifyToken(token)
}

// ── Server-component guard ────────────────────────────────────────────────────

/**
 * Require an authenticated user (with optional role restriction) in a
 * Server Component. Redirects automatically if the check fails.
 */
export async function requireAuth(allowedRoles?: string[]): Promise<JWTPayload> {
  const { redirect } = await import('next/navigation')
  const { getRoleRedirect } = await import('./constants')

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const authed = user as JWTPayload
  if (allowedRoles && !allowedRoles.includes(authed.role)) {
    redirect(getRoleRedirect(authed.role))
  }

  return authed
}
