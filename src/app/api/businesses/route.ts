import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'
import { computeTrustScore } from '@/lib/trust'

const PAGE_SIZE = 12

// Prisma owner select — must include fields needed for trust score
const OWNER_SELECT = {
  id:       true,
  name:     true,
  role:     true,
  verified: true,
  city:     true,
  province: true,
  phone:    true,
  bio:      true,
} as const

const COUNT_SELECT = { select: { connections: true, savedBy: true } } as const

function serialize(b: Record<string, unknown>) {
  return {
    ...b,
    askingPrice: b.askingPrice != null ? Number(b.askingPrice) : null,
    revenue:     b.revenue     != null ? Number(b.revenue)     : null,
    profit:      b.profit      != null ? Number(b.profit)      : null,
    createdAt:   (b.createdAt  as Date).toISOString(),
    updatedAt:   (b.updatedAt  as Date).toISOString(),
  }
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const auth = getAuthUserFromRequest(req)

    // ── Parse query params ───────────────────────────────────
    const q             = sp.get('q')?.trim() || null
    const industry      = sp.get('industry')  || null
    const province      = sp.get('province')  || null
    const listingType   = sp.get('listingType') || null
    const stageParam    = sp.get('stage')     || ''
    const stages        = stageParam ? stageParam.split(',').filter(Boolean) : []
    const minAsking     = sp.get('minAskingPrice') ? Number(sp.get('minAskingPrice')) : null
    const maxAsking     = sp.get('maxAskingPrice') ? Number(sp.get('maxAskingPrice')) : null
    const minRev        = sp.get('minRevenue')     ? Number(sp.get('minRevenue'))     : null
    const maxRev        = sp.get('maxRevenue')     ? Number(sp.get('maxRevenue'))     : null
    const verifiedOnly  = sp.get('verifiedOnly') === 'true'
    const seekingOperator = sp.get('seekingOperator') === 'true'
    const isRegistered  = sp.get('isRegistered') === 'true'
    const minTrust      = sp.get('minTrustScore') ? Number(sp.get('minTrustScore'))  : 0
    const sortBy        = sp.get('sortBy') || 'featured'
    const page          = Math.max(1, parseInt(sp.get('page') || '1'))

    // ── Build Prisma where ───────────────────────────────────
    const where: Record<string, unknown> = { status: 'ACTIVE' }

    if (q) {
      where.OR = [
        { title:       { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city:        { contains: q, mode: 'insensitive' } },
      ]
    }
    if (industry)    where.industry    = industry
    if (province)    where.province    = province
    if (listingType) where.listingType = listingType
    if (stages.length) where.stage     = { in: stages }
    if (minAsking)   where.askingPrice = { ...(where.askingPrice as object ?? {}), gte: minAsking }
    if (maxAsking)   where.askingPrice = { ...(where.askingPrice as object ?? {}), lte: maxAsking }
    if (minRev)      where.revenue     = { ...(where.revenue     as object ?? {}), gte: minRev }
    if (maxRev)      where.revenue     = { ...(where.revenue     as object ?? {}), lte: maxRev }
    if (verifiedOnly) where.owner      = { verified: true }
    if (seekingOperator) where.seekingOperator = true
    if (isRegistered)    where.isRegistered    = true

    // ── Sort ─────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any
    switch (sortBy) {
      case 'askingPrice': orderBy = [{ askingPrice: 'desc' }]; break
      case 'revenue':     orderBy = [{ revenue:     'desc' }]; break
      case 'newest':      orderBy = [{ createdAt:   'desc' }]; break
      default:            orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }]
    }

    // ── Trust score needs post-processing ────────────────────
    const needsPostProcess = sortBy === 'trustScore' || minTrust > 0

    // ── Get saved business IDs for current user ───────────────
    let savedSet = new Set<string>()
    if (auth) {
      const saved = await prisma.savedBusiness.findMany({
        where:  { userId: auth.userId },
        select: { businessId: true },
      })
      savedSet = new Set(saved.map((s) => s.businessId))
    }

    if (needsPostProcess) {
      // Fetch a larger batch, compute trust scores in memory, then paginate
      const all = await prisma.business.findMany({
        where,
        include: { owner: { select: OWNER_SELECT }, _count: COUNT_SELECT },
        orderBy,
        take: 600,
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scored = all.map((b) => ({ ...b, trustScore: computeTrustScore(b as any) }))

      const filtered = minTrust > 0 ? scored.filter((b) => b.trustScore >= minTrust) : scored

      if (sortBy === 'trustScore') {
        filtered.sort((a, b) => b.trustScore - a.trustScore)
      }

      const total     = filtered.length
      const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

      const data = paginated.map((b) => ({
        ...serialize(b as Record<string, unknown>),
        trustScore: b.trustScore,
        isSaved:    savedSet.has(b.id),
      }))

      return NextResponse.json({
        data,
        meta: { total, page, pages: Math.ceil(total / PAGE_SIZE), limit: PAGE_SIZE },
      })
    }

    // ── Standard DB-level pagination ─────────────────────────
    const [rows, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: { owner: { select: OWNER_SELECT }, _count: COUNT_SELECT },
        orderBy,
        skip:  (page - 1) * PAGE_SIZE,
        take:  PAGE_SIZE,
      }),
      prisma.business.count({ where }),
    ])

    const data = rows.map((b) => ({
      ...serialize(b as Record<string, unknown>),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trustScore: computeTrustScore(b as any),
      isSaved:    savedSet.has(b.id),
    }))

    return NextResponse.json({
      data,
      meta: { total, page, pages: Math.ceil(total / PAGE_SIZE), limit: PAGE_SIZE },
    })
  } catch (err) {
    console.error('[GET /api/businesses]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST /api/businesses — create a new business listing ─────────────────────

import { createBusinessSchema } from '@/lib/validation'
import { sanitizeShort, sanitizeRichText, sanitizeStringArray } from '@/lib/sanitize'
import { rateLimit, rateLimitResponse, CREATE_LIMIT } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'BUSINESS_OWNER') {
      return NextResponse.json({ error: 'Only business owners can create listings.' }, { status: 403 })
    }

    // Rate limit: 20 business creations per hour per user
    const rl = rateLimit(`create-business:${auth.userId}`, CREATE_LIMIT)
    if (!rl.ok) return rateLimitResponse(rl)

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const parsed = createBusinessSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]!.message, field: parsed.error.issues[0]!.path[0] },
        { status: 400 }
      )
    }

    const d = parsed.data

    // Sanitize all text fields before persisting
    const sanitised = {
      ...d,
      title:       sanitizeShort(d.title, 160),
      description: sanitizeRichText(d.description, 10_000),
      city:        sanitizeShort(d.city, 80),
      highlights:  sanitizeStringArray(d.highlights, { maxItems: 6, maxItemLen: 120 }),
    }

    const business = await prisma.business.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...sanitised, ownerId: auth.userId } as any,
    })

    return NextResponse.json({
      data: { ...serialize(business as Record<string, unknown>), trustScore: 0 },
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/businesses]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
