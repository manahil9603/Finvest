import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { resetPasswordSchema } from '@/lib/validation'
import { rateLimit, rateLimitResponse, getClientIp, AUTH_LIMIT } from '@/lib/rateLimit'
import { handleCors, addCorsHeaders } from '@/lib/cors'
import { clearAuthCookie } from '@/lib/auth'
import { hashPasswordResetToken } from '@/lib/password-reset'

const BCRYPT_ROUNDS = 12

export async function OPTIONS(req: NextRequest) {
  return handleCors(req) ?? new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  const ip = getClientIp(req)
  const rl = rateLimit(`reset:${ip}`, AUTH_LIMIT)
  if (!rl.ok) return rateLimitResponse(rl)

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]!
      return NextResponse.json(
        { error: issue.message, field: issue.path[0] },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data
    const tokenHash = hashPasswordResetToken(token)

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt:    null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { select: { id: true, active: true } } },
    })

    if (!record || !record.user.active) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data:  { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data:  { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId, id: { not: record.id } },
      }),
    ])

    const response = NextResponse.json({
      message: 'Your password has been updated. You can sign in now.',
      redirect: '/login',
    })
    clearAuthCookie(response)
    return addCorsHeaders(req, response)
  } catch (err) {
    console.error('[POST /api/auth/reset-password]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
