import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'
import { computeTrustScore } from '@/lib/trust'

const OWNER_SELECT = {
  id: true, name: true, role: true, verified: true,
  city: true, province: true, phone: true, bio: true,
} as const

/** GET /api/businesses/saved — watchlist for the authenticated user */
export async function GET(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.savedBusiness.findMany({
    where:   { userId: auth.userId },
    include: {
      business: {
        include: {
          owner:  { select: OWNER_SELECT },
          _count: { select: { connections: true, savedBy: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = rows.map((row) => ({
    savedId:   row.id,
    note:      row.note,
    savedAt:   row.createdAt.toISOString(),
    business: {
      ...row.business,
      askingPrice: row.business.askingPrice != null ? Number(row.business.askingPrice) : null,
      revenue:     row.business.revenue     != null ? Number(row.business.revenue)     : null,
      profit:      row.business.profit      != null ? Number(row.business.profit)      : null,
      createdAt:   row.business.createdAt.toISOString(),
      updatedAt:   row.business.updatedAt.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trustScore:  computeTrustScore(row.business as any),
      isSaved:     true,
    },
  }))

  return NextResponse.json({ data })
}
