import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

async function resolveAndCheck(req: NextRequest, params: Promise<{ id: string }>) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id: businessId } = await params
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business) return { error: NextResponse.json({ error: 'Business not found' }, { status: 404 }) }
  if (business.ownerId === auth.userId) {
    return { error: NextResponse.json({ error: 'Cannot save your own listing' }, { status: 400 }) }
  }
  return { auth, businessId, business }
}

/** POST — toggle save/unsave (used from explore cards) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = await resolveAndCheck(req, params)
  if ('error' in res) return res.error
  const { auth, businessId } = res

  const existing = await prisma.savedBusiness.findUnique({
    where: { userId_businessId: { userId: auth.userId, businessId } },
  })

  if (existing) {
    await prisma.savedBusiness.delete({ where: { id: existing.id } })
    return NextResponse.json({ data: { saved: false, businessId } })
  }

  const body = await req.json().catch(() => ({}))
  await prisma.savedBusiness.create({
    data: { userId: auth.userId, businessId, note: (body as { note?: string }).note ?? null },
  })

  return NextResponse.json({ data: { saved: true, businessId } }, { status: 201 })
}

/** DELETE — explicit unsave */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = await resolveAndCheck(req, params)
  if ('error' in res) return res.error
  const { auth, businessId } = res

  await prisma.savedBusiness.deleteMany({
    where: { userId: auth.userId, businessId },
  })

  return NextResponse.json({ data: { saved: false, businessId } })
}
