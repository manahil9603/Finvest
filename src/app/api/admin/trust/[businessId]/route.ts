import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'
import { computeTrustScore } from '@/lib/trust'

const schema = z.object({
  /** Set owner.verified — the largest single driver of trust score (+40 pts) */
  verifyOwner: z.boolean(),
})

/**
 * PUT /api/admin/trust/:businessId
 *
 * Sets the business owner's `verified` field, which immediately
 * raises (or lowers) the computed trust score by 40 points.
 *
 * In a future iteration this could store a manual override on
 * the business itself.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const auth = getAuthUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { businessId } = await params

  const business = await prisma.business.findUnique({
    where:   { id: businessId },
    include: {
      owner: {
        select: { id: true, name: true, verified: true, phone: true, bio: true },
      },
    },
  })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // Update owner verification status
  await prisma.user.update({
    where: { id: business.ownerId },
    data:  { verified: parsed.data.verifyOwner },
  })

  // Re-compute trust score with updated owner
  const newTrustScore = computeTrustScore({
    askingPrice: business.askingPrice,
    revenue:     business.revenue,
    profit:      business.profit,
    highlights:  business.highlights,
    owner: {
      verified: parsed.data.verifyOwner,
      phone:    business.owner.phone,
      bio:      business.owner.bio,
    },
  })

  return NextResponse.json({
    data:       { businessId, ownerVerified: parsed.data.verifyOwner, trustScore: newTrustScore },
    message:    parsed.data.verifyOwner
      ? `Owner "${business.owner.name}" verified. Trust score is now ${newTrustScore}/100.`
      : `Verification removed for "${business.owner.name}". Trust score is now ${newTrustScore}/100.`,
  })
}
