import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'
import { profileUpdateSchema } from '@/lib/validation'
import { sanitizeShort, sanitizeRichText } from '@/lib/sanitize'

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
