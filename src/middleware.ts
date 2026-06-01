import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenEdge } from '@/lib/jwt-verify-edge'
import { canAccess, isProtectedPath, getRoleRedirect } from '@/lib/rbac'
import { AUTH_COOKIE } from '@/lib/constants'

// ── Security headers applied to every response ────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options':  'nosniff',
  // Disallow embedding in iframes (clickjacking)
  'X-Frame-Options':         'SAMEORIGIN',
  // Legacy XSS filter (belt-and-suspenders)
  'X-XSS-Protection':        '1; mode=block',
  // Limit referrer information
  'Referrer-Policy':         'strict-origin-when-cross-origin',
  // Disable browser feature APIs we don't use
  'Permissions-Policy':      'camera=(), microphone=(), geolocation=(), payment=()',
  // Prevent DNS prefetch on third-party domains
  'X-DNS-Prefetch-Control':  'on',
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  // HSTS — only in production over HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }
  return response
}

// ── Route guards ──────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Guard /api/admin/** at the edge ────────────────────────────────────────
  // Double-check: individual routes also verify role, but this provides
  // a fast-path rejection before any DB work is done.
  if (pathname.startsWith('/api/admin')) {
    const token   = request.cookies.get(AUTH_COOKIE)?.value
    const payload = token ? await verifyTokenEdge(token) : null

    if (!payload || payload.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'Forbidden: Admin access required.' },
        { status: 403 }
      )
      return applySecurityHeaders(res)
    }

    const res = NextResponse.next()
    res.headers.set('x-user-id',    payload.userId)
    res.headers.set('x-user-role',  payload.role)
    res.headers.set('x-user-email', payload.email)
    return applySecurityHeaders(res)
  }

  // ── Non-API page route guards ───────────────────────────────────────────────
  if (!isProtectedPath(pathname)) {
    // Still apply security headers to public pages
    return applySecurityHeaders(NextResponse.next())
  }

  const token   = request.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? await verifyTokenEdge(token) : null

  // Not authenticated → redirect to login
  if (!payload) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const res = NextResponse.redirect(loginUrl)
    return applySecurityHeaders(res)
  }

  // Authenticated but wrong role for this route
  if (!canAccess(pathname, payload.role)) {
    const res = NextResponse.redirect(
      new URL(getRoleRedirect(payload.role), request.url)
    )
    return applySecurityHeaders(res)
  }

  // Authenticated and authorised — pass auth info downstream
  const res = NextResponse.next()
  res.headers.set('x-user-id',    payload.userId)
  res.headers.set('x-user-role',  payload.role)
  res.headers.set('x-user-email', payload.email)
  return applySecurityHeaders(res)
}

export const config = {
  matcher: [
    // Page routes that need auth / role guards
    '/dashboard/:path*',
    '/admin/:path*',
    '/admin',
    '/messages/:path*',
    '/profile/:path*',
    '/listings/new',
    // Admin API — edge-level guard (belt-and-suspenders with in-route checks)
    '/api/admin/:path*',
  ],
}
