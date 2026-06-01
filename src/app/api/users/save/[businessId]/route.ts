import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

type SaveParams = Promise<{ businessId: string }>

async function resolveSaveTarget(req: NextRequest, params: SaveParams) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { businessId } = await params
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true },
  })

  if (!business) {
    return { error: NextResponse.json({ error: 'Business not found' }, { status: 404 }) }
  }

  if (business.ownerId === auth.userId) {
    return { error: NextResponse.json({ error: 'Cannot save your own listing' }, { status: 400 }) }
  }

  return { auth, businessId }
}

export async function POST(
  req: NextRequest,
  { params }: { params: SaveParams }
) {
  const resolved = await resolveSaveTarget(req, params)
  if ('error' in resolved) return resolved.error

  const { auth, businessId } = resolved
  const existing = await prisma.savedBusiness.findUnique({
    where: { userId_businessId: { userId: auth.userId, businessId } },
  })

  if (existing) {
    return NextResponse.json({ data: { saved: true, businessId } })
  }

  const body = await req.json().catch(() => ({}))
  await prisma.savedBusiness.create({
    data: {
      userId: auth.userId,
      businessId,
      note: (body as { note?: string }).note ?? null,
    },
  })

  return NextResponse.json({ data: { saved: true, businessId } }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: SaveParams }
) {
  const resolved = await resolveSaveTarget(req, params)
  if ('error' in resolved) return resolved.error

  const { auth, businessId } = resolved
  await prisma.savedBusiness.deleteMany({
    where: { userId: auth.userId, businessId },
  })

  return NextResponse.json({ data: { saved: false, businessId } })
}
