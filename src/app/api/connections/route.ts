import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'
import { connectionSchema } from '@/lib/validation'
import { sanitizeMessage } from '@/lib/sanitize'
import { rateLimit, rateLimitResponse, CREATE_LIMIT } from '@/lib/rateLimit'

const ALLOWED_ROLES = ['INVESTOR', 'BUYER']

// ── POST /api/connections ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) {
    return NextResponse.json({ error: 'You must be signed in to connect.' }, { status: 401 })
  }

  // Role gate — investors and buyers only
  if (!ALLOWED_ROLES.includes(auth.role)) {
    return NextResponse.json(
      { error: 'Only investors and buyers can send connection requests.' },
      { status: 403 }
    )
  }

  // Rate limit: 20 connection requests per hour per user
  const rl = rateLimit(`connections:${auth.userId}`, CREATE_LIMIT)
  if (!rl.ok) return rateLimitResponse(rl)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = connectionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]!.message }, { status: 400 })
  }

  const { businessId, type: reqType } = parsed.data
  const message = sanitizeMessage(parsed.data.message, 1000)

  if (message.length < 30) {
    return NextResponse.json(
      { error: 'Please write at least 30 characters in your introduction message.' },
      { status: 400 }
    )
  }

  const business = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { id: true, ownerId: true, listingType: true, status: true, title: true },
  })

  if (!business || business.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'Business not found or no longer active.' },
      { status: 404 }
    )
  }

  // Owners cannot connect to their own listing
  if (business.ownerId === auth.userId) {
    return NextResponse.json(
      { error: 'You cannot send a connection request to your own listing.' },
      { status: 400 }
    )
  }

  const connectionType: 'INVESTMENT' | 'BUYING' =
    reqType ?? (business.listingType === 'ACQUISITION' ? 'BUYING' : 'INVESTMENT')

  // One request per (sender × business × type)
  const existing = await prisma.connectionRequest.findUnique({
    where: { senderId_businessId_type: { senderId: auth.userId, businessId, type: connectionType } },
    select: { id: true, status: true },
  })

  if (existing) {
    const statusMsg: Record<string, string> = {
      PENDING:  'You already have a pending request for this business.',
      ACCEPTED: 'You are already connected with this business owner.',
      REJECTED: 'Your previous request was declined.',
    }
    return NextResponse.json(
      {
        error:    statusMsg[existing.status] ?? 'A request for this business already exists.',
        existing: { status: existing.status, id: existing.id },
      },
      { status: 409 }
    )
  }

  const connection = await prisma.connectionRequest.create({
    data: {
      senderId:   auth.userId,
      receiverId: business.ownerId,
      businessId,
      type:       connectionType,
      message,
      status:     'PENDING',
    },
    select: { id: true, status: true, type: true },
  })

  return NextResponse.json(
    {
      data:    { id: connection.id, status: 'PENDING', type: connectionType },
      message: 'Connection request sent!',
    },
    { status: 201 }
  )
}

// ── GET /api/connections — list current user's outgoing connections ────────────

export async function GET(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role === 'BUSINESS_OWNER') {
    const connections = await prisma.connectionRequest.findMany({
      where:   { receiverId: auth.userId },
      include: {
        business: { select: { id: true, title: true, industry: true, city: true } },
        sender:   { select: { id: true, name: true, role: true, verified: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      data: connections.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    })
  }

  const connections = await prisma.connectionRequest.findMany({
    where:   { senderId: auth.userId },
    include: {
      business: { select: { id: true, title: true, industry: true, city: true } },
      receiver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    data: connections.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  })
}
