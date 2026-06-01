import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'
import { computeTrustScore } from '@/lib/trust'

export async function GET(req: NextRequest) {
  try {
    const auth  = getAuthUserFromRequest(req)
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '6'), 12)

    const businesses = await prisma.business.findMany({
      where:   { status: 'ACTIVE', featured: true },
      include: {
        owner: {
          select: { id: true, name: true, role: true, verified: true, city: true, province: true, phone: true, bio: true },
        },
        _count: { select: { connections: true, savedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    })

    let savedSet = new Set<string>()
    if (auth) {
      const saved = await prisma.savedBusiness.findMany({
        where:  { userId: auth.userId },
        select: { businessId: true },
      })
      savedSet = new Set(saved.map((s) => s.businessId))
    }

    const data = businesses.map((b) => ({
      ...b,
      askingPrice: b.askingPrice != null ? Number(b.askingPrice) : null,
      revenue:     b.revenue     != null ? Number(b.revenue)     : null,
      profit:      b.profit      != null ? Number(b.profit)      : null,
      createdAt:   b.createdAt.toISOString(),
      updatedAt:   b.updatedAt.toISOString(),
      trustScore:  computeTrustScore(b),
      isSaved:     savedSet.has(b.id),
    }))

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/businesses/featured]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
