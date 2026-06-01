import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingId, businessId = listingId, note } = await req.json()
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })

  const interest = await prisma.savedBusiness.upsert({
    where: { userId_businessId: { userId: auth.userId, businessId } },
    create: { userId: auth.userId, businessId, note },
    update: { note },
  })

  return NextResponse.json({ data: interest })
}

export async function DELETE(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingId, businessId = listingId } = await req.json()
  await prisma.savedBusiness.deleteMany({
    where: { userId: auth.userId, businessId },
  })

  return NextResponse.json({ message: 'Removed' })
}
