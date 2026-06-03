import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest, clearAuthCookie } from '@/lib/auth'
import { profileUpdateSchema, deleteAccountSchema } from '@/lib/validation'
import { sanitizeShort, sanitizeRichText } from '@/lib/sanitize'
import { sendAccountDeletedEmail } from '@/lib/email'

export async function PATCH(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]!.message }, { status: 400 })
  }

  const d = parsed.data

  const sanitised = {
    ...d,
    name:  d.name  ? sanitizeShort(d.name, 80)           : undefined,
    city:  d.city  ? sanitizeShort(d.city, 80)            : d.city,
    phone: d.phone ? sanitizeShort(d.phone, 30)           : d.phone,
    bio:   d.bio   ? sanitizeRichText(d.bio, 500)         : d.bio,
  }

  const user = await prisma.user.update({
    where:  { id: auth.userId },
    data:   sanitised,
    select: { id: true, name: true, email: true, role: true, phone: true, city: true, bio: true, verified: true },
  })

  return NextResponse.json({ data: user })
}

/** DELETE — permanently delete the signed-in user and all associated data */
export async function DELETE(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = deleteAccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]!.message }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where:  { id: auth.userId },
    select: { id: true, name: true, email: true, password: true, active: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const passwordMatch = await bcrypt.compare(parsed.data.password, user.password)
  if (!passwordMatch) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  try {
    await sendAccountDeletedEmail({ to: user.email, name: user.name })
  } catch (err) {
    console.error('[DELETE /api/profile] deletion email:', err)
  }

  await prisma.user.delete({ where: { id: user.id } })

  const response = NextResponse.json({
    message: 'Your account and all associated data have been permanently deleted.',
    redirect: '/',
  })
  clearAuthCookie(response)
  return response
}
