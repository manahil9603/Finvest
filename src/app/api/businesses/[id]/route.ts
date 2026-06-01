import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'
import { computeTrustScore } from '@/lib/trust'
import { updateBusinessSchema } from '@/lib/validation'
import { sanitizeShort, sanitizeRichText, sanitizeStringArray } from '@/lib/sanitize'

const OWNER_SELECT = {
  id: true, name: true, role: true, verified: true,
  city: true, province: true, phone: true, bio: true,
  avatarUrl: true, createdAt: true,
} as const

// ── GET /api/businesses/:id ───────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth   = getAuthUserFromRequest(req)

  const business = await prisma.business.findUnique({
    where:   { id },
    include: {
      owner:  { select: OWNER_SELECT },
      _count: { select: { connections: true, savedBy: true } },
    },
  })

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // DRAFT listings are only visible to the owner and admins
  if (
    business.status === 'DRAFT' &&
    business.ownerId !== auth?.userId &&
    auth?.role !== 'ADMIN'
  ) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const isSaved = auth
    ? !!(await prisma.savedBusiness.findUnique({
        where: { userId_businessId: { userId: auth.userId, businessId: id } },
      }))
    : false

  const existingConnection = auth
    ? await prisma.connectionRequest.findFirst({
        where:   { senderId: auth.userId, businessId: id },
        select:  { id: true, status: true, type: true },
        orderBy: { createdAt: 'desc' },
      })
    : null

  const serialised = {
    ...business,
    askingPrice: business.askingPrice != null ? Number(business.askingPrice) : null,
    revenue:     business.revenue     != null ? Number(business.revenue)     : null,
    profit:      business.profit      != null ? Number(business.profit)      : null,
    createdAt:   business.createdAt.toISOString(),
    updatedAt:   business.updatedAt.toISOString(),
    owner: {
      ...business.owner,
      createdAt: business.owner.createdAt.toISOString(),
    },
    trustScore:       computeTrustScore(business as Parameters<typeof computeTrustScore>[0]),
    isSaved,
    connectionStatus: existingConnection?.status ?? 'NONE',
    connectionId:     existingConnection?.id ?? null,
  }

  return NextResponse.json({ data: serialised })
}

// ── PUT /api/businesses/:id ───────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth   = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch existing record first to verify ownership
  const existing = await prisma.business.findUnique({
    where:  { id },
    select: { id: true, ownerId: true },
  })
  if (!existing) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Ownership check — only the owner can update
  if (existing.ownerId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse + validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = updateBusinessSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]!.message }, { status: 400 })
  }

  const data = parsed.data

  // Sanitize all text fields before writing to DB
  const sanitised = {
    ...data,
    title:       data.title       ? sanitizeShort(data.title, 160)        : undefined,
    description: data.description ? sanitizeRichText(data.description)    : undefined,
    city:        data.city        ? sanitizeShort(data.city, 80)          : undefined,
    highlights:  data.highlights  ? sanitizeStringArray(data.highlights, { maxItems: 6, maxItemLen: 120 }) : undefined,
  }

  const updated = await prisma.business.update({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: { id }, data: sanitised as any,
  })

  return NextResponse.json({
    data: {
      ...updated,
      askingPrice: updated.askingPrice != null ? Number(updated.askingPrice) : null,
      revenue:     updated.revenue     != null ? Number(updated.revenue)     : null,
      profit:      updated.profit      != null ? Number(updated.profit)      : null,
      createdAt:   updated.createdAt.toISOString(),
      updatedAt:   updated.updatedAt.toISOString(),
    },
  })
}

// ── DELETE /api/businesses/:id ────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth   = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.business.findUnique({
    where:  { id },
    select: { id: true, ownerId: true, title: true },
  })
  if (!existing) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Ownership check
  if (existing.ownerId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Cascade deletion is handled by Prisma schema (onDelete: Cascade on relations)
  await prisma.business.delete({ where: { id } })

  return NextResponse.json({ message: `Business "${existing.title}" deleted successfully.` })
}
