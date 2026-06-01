import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

/**
 * POST /api/businesses/:id/boost
 *
 * Toggles the `featured` flag on a business listing.
 * In production this would require a payment step before boosting.
 * Business owners can only boost their own listings.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth   = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await prisma.business.findUnique({
    where:  { id },
    select: { id: true, ownerId: true, featured: true, status: true },
  })

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  if (business.ownerId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (business.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Only active listings can be boosted.' }, { status: 400 })
  }

  const updated = await prisma.business.update({
    where: { id },
    data:  { featured: !business.featured },
    select:{ id: true, featured: true },
  })

  return NextResponse.json({
    data:    updated,
    message: updated.featured ? 'Listing boosted successfully!' : 'Boost removed.',
  })
}
