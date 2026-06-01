import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const listing = await prisma.business.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, role: true, verified: true, city: true, bio: true, phone: true },
      },
      _count: { select: { savedBy: true, connections: true } },
    },
  })

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: listing })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const listing = await prisma.business.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (listing.ownerId !== auth.userId && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.business.delete({ where: { id } })
  return NextResponse.json({ message: 'Deleted' })
}
