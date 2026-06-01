import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken, setAuthCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { getRoleRedirect } from '@/lib/constants'
import { rateLimit, rateLimitResponse, getClientIp, AUTH_LIMIT } from '@/lib/rateLimit'
import { handleCors, addCorsHeaders } from '@/lib/cors'

// ── Timing-safe dummy hash ────────────────────────────────────────────────────
// Generated once at module load so it's a valid bcrypt hash (60 chars, 12 rounds).
// bcrypt.compare() takes the same wall-clock time regardless of whether the
// user account exists — preventing email enumeration via timing attacks.
let _dummyHash: string | null = null

async function getDummyHash(): Promise<string> {
  if (!_dummyHash) {
    // Generate a random secret; hash it with the same cost factor as production
    const { randomBytes } = await import('crypto')
    _dummyHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12)
  }
  return _dummyHash
}

// Warm up the dummy hash during module initialisation (async fire-and-forget).
getDummyHash().catch(() => {})

// ── Handler ───────────────────────────────────────────────────────────────────

export async function OPTIONS(req: NextRequest) {
  return handleCors(req) ?? new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  // ── Rate limit: 5 failed attempts per IP per 15 minutes ───────────────────
  const ip       = getClientIp(req)
  const rlResult = rateLimit(`login:${ip}`, AUTH_LIMIT)
  if (!rlResult.ok) return rateLimitResponse(rlResult)

  // ── Also rate-limit per email to prevent credential stuffing ──────────────
  // (We apply this after parsing so the email key is available)

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const { email, password } = parsed.data

    // Per-email rate limit (stops targeted brute-force on a known account)
    const emailRl = rateLimit(`login-email:${email}`, AUTH_LIMIT)
    if (!emailRl.ok) return rateLimitResponse(emailRl)

    // ── Fetch user ──────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where:  { email },
      select: { id: true, name: true, email: true, role: true, password: true, active: true },
    })

    // ── Constant-time password check ────────────────────────────────────────
    // Always run bcrypt.compare, even when the user doesn't exist, so that
    // the response time doesn't leak whether an email is registered.
    const dummy = await getDummyHash()
    const hashToCheck = user?.password ?? dummy

    const passwordMatch = await bcrypt.compare(password, hashToCheck)

    // ── Authentication decision ─────────────────────────────────────────────
    // Deliberately vague error to prevent user enumeration
    if (!user || !passwordMatch) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support@finvest.pk' },
        { status: 403 }
      )
    }

    // ── Issue JWT ────────────────────────────────────────────────────────────
    const token    = signToken({ userId: user.id, email: user.email, role: user.role })
    const redirect = getRoleRedirect(user.role)

    const response = NextResponse.json({
      data:    { id: user.id, name: user.name, email: user.email, role: user.role },
      redirect,
      message: 'Signed in successfully',
    })
    setAuthCookie(response, token)
    return addCorsHeaders(req, response)
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
