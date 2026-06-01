import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id:        true,
      email:     true,
      name:      true,
      role:      true,
      phone:     true,
      city:      true,
      bio:       true,
      verified:  true,
      active:    true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user)   return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!user.active) return NextResponse.json({ error: 'Account deactivated' }, { status: 403 })

  return NextResponse.json({ data: user })
}
