import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { forgotPasswordSchema } from '@/lib/validation'
import { rateLimit, rateLimitResponse, getClientIp, AUTH_LIMIT } from '@/lib/rateLimit'
import { handleCors, addCorsHeaders } from '@/lib/cors'
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email'
import {
  generatePasswordResetToken,
  PASSWORD_RESET_EXPIRY_MS,
} from '@/lib/password-reset'

const GENERIC_MESSAGE =
  'If an account with that email exists, we have sent password reset instructions.'

export async function OPTIONS(req: NextRequest) {
  return handleCors(req) ?? new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  const ip = getClientIp(req)
  const rl = rateLimit(`forgot:${ip}`, AUTH_LIMIT)
  if (!rl.ok) return rateLimitResponse(rl)

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'Password reset is temporarily unavailable. Please try again later.' },
      { status: 503 }
    )
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]!
      return NextResponse.json({ error: issue.message, field: issue.path[0] }, { status: 400 })
    }

    const { email } = parsed.data

    const emailRl = rateLimit(`forgot-email:${email}`, AUTH_LIMIT)
    if (!emailRl.ok) return rateLimitResponse(emailRl)

    const user = await prisma.user.findUnique({
      where:  { email },
      select: { id: true, name: true, email: true, active: true },
    })

    if (user?.active) {
      const { plain, hash } = generatePasswordResetToken()
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS)

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      })

      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hash, expiresAt },
      })

      const appUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')
      const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(plain)}`

      try {
        await sendPasswordResetEmail({
          to:       user.email,
          name:     user.name,
          resetUrl,
        })
      } catch (err) {
        console.error('[POST /api/auth/forgot-password] email:', err)
        await prisma.passwordResetToken.deleteMany({ where: { tokenHash: hash } })
        return NextResponse.json(
          { error: 'Could not send reset email. Please try again shortly.' },
          { status: 503 }
        )
      }
    }

    return addCorsHeaders(
      req,
      NextResponse.json({ message: GENERIC_MESSAGE })
    )
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
