import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'
import { messageSchema } from '@/lib/validation'
import { sanitizeMessage } from '@/lib/sanitize'
import { rateLimit, rateLimitResponse, MESSAGE_LIMIT } from '@/lib/rateLimit'

/** Verify an accepted connection exists between the two users. */
async function hasAcceptedConnection(uid1: string, uid2: string, role: string): Promise<boolean> {
  if (role === 'ADMIN') return true
  const conn = await prisma.connectionRequest.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { senderId: uid1, receiverId: uid2 },
        { senderId: uid2, receiverId: uid1 },
      ],
    },
    select: { id: true },
  })
  return !!conn
}

// ── GET /api/messages/:userId — fetch full conversation ──────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId: partnerId } = await params

  if (partnerId === auth.userId) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
  }

  const [partner, allowed] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: partnerId, active: true },
      select: { id: true, name: true, role: true, verified: true, city: true, avatarUrl: true },
    }),
    hasAcceptedConnection(auth.userId, partnerId, auth.role),
  ])

  if (!partner) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'You can only message users you have an accepted connection with.' },
      { status: 403 }
    )
  }

  const since = req.nextUrl.searchParams.get('since')

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: auth.userId, receiverId: partnerId },
        { senderId: partnerId,   receiverId: auth.userId },
      ],
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take:    200,
  })

  const unreadIds = messages
    .filter((m) => m.receiverId === auth.userId && !m.read)
    .map((m) => m.id)
  if (unreadIds.length > 0) {
    await prisma.message.updateMany({ where: { id: { in: unreadIds } }, data: { read: true } })
  }

  return NextResponse.json({
    data: {
      partner,
      messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    },
  })
}

// ── POST /api/messages/:userId — send a message ──────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId: recipientId } = await params

  if (recipientId === auth.userId) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
  }

  // 60 messages per minute per user
  const rl = rateLimit(`messages:${auth.userId}`, MESSAGE_LIMIT)
  if (!rl.ok) return rateLimitResponse(rl)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]!.message }, { status: 400 })
  }

  const content = sanitizeMessage(parsed.data.content, 2000)
  if (!content.trim()) {
    return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
  }

  const [recipient, allowed] = await Promise.all([
    prisma.user.findUnique({ where: { id: recipientId, active: true }, select: { id: true } }),
    hasAcceptedConnection(auth.userId, recipientId, auth.role),
  ])

  if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'You can only message users you have an accepted connection with.' },
      { status: 403 }
    )
  }

  const message = await prisma.message.create({
    data: { senderId: auth.userId, receiverId: recipientId, content },
  })

  return NextResponse.json(
    { data: { ...message, createdAt: message.createdAt.toISOString() } },
    { status: 201 }
  )
}
