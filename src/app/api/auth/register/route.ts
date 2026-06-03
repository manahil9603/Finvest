import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken, setAuthCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/validation'
import { sanitizeShort } from '@/lib/sanitize'
import { getRoleRedirect } from '@/lib/constants'
import { rateLimit, rateLimitResponse, getClientIp, AUTH_LIMIT } from '@/lib/rateLimit'
import { handleCors, addCorsHeaders } from '@/lib/cors'
import { isEmailConfigured, sendAccountCreatedEmail } from '@/lib/email'

const BCRYPT_ROUNDS = 12   // OWASP minimum is 10; 12 gives ~250 ms hashing time

export async function OPTIONS(req: NextRequest) {
  return handleCors(req) ?? new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  // ── CORS preflight ─────────────────────────────────────────────────────────
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  // ── Rate limiting: 5 registration attempts per IP per 15 minutes ──────────
  const ip     = getClientIp(req)
  const rlResult = rateLimit(`register:${ip}`, AUTH_LIMIT)
  if (!rlResult.ok) return rateLimitResponse(rlResult)

  try {
    // ── Parse + validate body ────────────────────────────────────────────────
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]!
      return NextResponse.json(
        { error: issue.message, field: issue.path[0] },
        { status: 400 }
      )
    }

    const { name, email, password, role, phone, city } = parsed.data

    // ── Sanitize free-text inputs ────────────────────────────────────────────
    const safeName  = sanitizeShort(name, 80)
    const safeCity  = city  ? sanitizeShort(city,  80) : null
    const safePhone = phone ? sanitizeShort(phone, 30) : null

    // ── Duplicate check ──────────────────────────────────────────────────────
    const existing = await prisma.user.findUnique({
      where:  { email },
      select: { id: true },
    })
    if (existing) {
      // Use generic message to avoid email enumeration
      return NextResponse.json(
        { error: 'An account with this email already exists.', field: 'email' },
        { status: 409 }
      )
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Registration is temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    // ── Hash password ────────────────────────────────────────────────────────
    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)

    // ── Create user ──────────────────────────────────────────────────────────
    const user = await prisma.user.create({
      data: {
        name:  safeName,
        email,
        password: hashed,
        role,
        phone: safePhone,
        city:  safeCity,
      },
      select: { id: true, name: true, email: true, role: true },
    })

    // ── Welcome email must succeed or account is rolled back ─────────────────
    try {
      await sendAccountCreatedEmail({
        to:   user.email,
        name: user.name,
        role: user.role,
      })
    } catch (err) {
      console.error('[POST /api/auth/register] welcome email:', err)
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
      return NextResponse.json(
        {
          error: 'We could not send a confirmation email to that address. Check the email and try again.',
          field: 'email',
        },
        { status: 422 }
      )
    }

    // ── Issue JWT ────────────────────────────────────────────────────────────
    const token    = signToken({ userId: user.id, email: user.email, role: user.role })
    const redirect = getRoleRedirect(user.role)

    const response = NextResponse.json(
      { data: { id: user.id, name: user.name, email: user.email, role: user.role }, redirect, message: 'Account created successfully' },
      { status: 201 }
    )
    setAuthCookie(response, token)
    return addCorsHeaders(req, response)
  } catch (err) {
    console.error('[POST /api/auth/register]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
