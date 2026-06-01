import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'
import { computeTrustScore } from '@/lib/trust'

const OWNER_SELECT = {
  id: true, name: true, role: true, verified: true,
  city: true, province: true, phone: true, bio: true,
} as const

/**
 * GET /api/businesses/recommended
 *
 * Returns businesses personalised to the investor's profile.
 * Falls back to featured/newest when the profile is empty.
 *
 * Query params (override profile preferences):
 *   industries  — comma-separated Industry enum values
 *   provinces   — comma-separated Province enum values
 *   minPrice    — minimum asking price (PKR)
 *   maxPrice    — maximum asking price (PKR)
 *   limit       — max results (default 12)
 */
export async function GET(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = req.nextUrl.searchParams

  // ── Resolve preferences (query params override profile) ──────────────
  let prefIndustries: string[] = sp.get('industries')?.split(',').filter(Boolean) ?? []
  let prefProvinces:  string[] = sp.get('provinces')?.split(',').filter(Boolean) ?? []
  let minPrice = sp.get('minPrice') ? Number(sp.get('minPrice')) : null
  let maxPrice = sp.get('maxPrice') ? Number(sp.get('maxPrice')) : null
  const limit  = Math.min(parseInt(sp.get('limit') ?? '12'), 24)

  // Fall back to saved InvestorProfile if no overrides
  if (prefIndustries.length === 0 && prefProvinces.length === 0 && !minPrice && !maxPrice) {
    const profile = await prisma.investorProfile.findUnique({
      where: { userId: auth.userId },
    })
    if (profile) {
      prefIndustries = profile.preferredIndustries as string[]
      prefProvinces  = profile.preferredProvinces  as string[]
      minPrice = profile.minInvestment != null ? Number(profile.minInvestment) : null
      maxPrice = profile.maxInvestment != null ? Number(profile.maxInvestment) : null
    }
  }

  // ── Get already-saved business IDs so we can mark them ──────────────
  const savedRows = await prisma.savedBusiness.findMany({
    where:  { userId: auth.userId },
    select: { businessId: true },
  })
  const savedSet = new Set(savedRows.map((s) => s.businessId))

  // ── Build Prisma where clause ────────────────────────────────────────
  const where: Record<string, unknown> = {
    status:  'ACTIVE',
    ownerId: { not: auth.userId },   // never recommend own listings
  }

  if (prefIndustries.length > 0) where.industry = { in: prefIndustries }
  if (prefProvinces.length  > 0) where.province  = { in: prefProvinces }
  if (minPrice) where.askingPrice = { ...(where.askingPrice as object ?? {}), gte: minPrice }
  if (maxPrice) where.askingPrice = { ...(where.askingPrice as object ?? {}), lte: maxPrice }

  const businesses = await prisma.business.findMany({
    where,
    include: {
      owner:  { select: OWNER_SELECT },
      _count: { select: { connections: true, savedBy: true } },
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: limit * 3,  // over-fetch so we can sort by trust score and trim
  })

  // Sort by trust score, then trim to limit
  const scored = businesses
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b) => ({ ...b, trustScore: computeTrustScore(b as any), isSaved: savedSet.has(b.id) }))
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, limit)

  const data = scored.map((b) => ({
    ...b,
    askingPrice: b.askingPrice != null ? Number(b.askingPrice) : null,
    revenue:     b.revenue     != null ? Number(b.revenue)     : null,
    profit:      b.profit      != null ? Number(b.profit)      : null,
    createdAt:   b.createdAt.toISOString(),
    updatedAt:   b.updatedAt.toISOString(),
  }))

  return NextResponse.json({ data, meta: { total: data.length, personalised: prefIndustries.length > 0 || !!minPrice } })
}
