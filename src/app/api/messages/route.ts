import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

/**
 * GET /api/messages
 *
 * Returns the authenticated user's inbox:
 * — latest message per unique conversation partner
 * — includes unread count
 * — includes partner user info
 *
 * Query params:
 *   direction  sent | received (default: both → shows inbox)
 *   limit      max conversations (default 10)
 */
export async function GET(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp        = req.nextUrl.searchParams
  const direction = sp.get('direction') ?? 'inbox'
  const limit     = Math.min(parseInt(sp.get('limit') ?? '10'), 50)

  if (direction === 'sent') {
    const messages = await prisma.message.findMany({
      where:   { senderId: auth.userId },
      include: { receiver: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    })
    return NextResponse.json({
      data: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    })
  }

  // ── Inbox: latest message per partner ──────────────────────────────
  // Fetch all recent messages involving this user (both sides)
  const allMessages = await prisma.message.findMany({
    where: {
      OR: [
        { receiverId: auth.userId },
        { senderId:   auth.userId },
      ],
    },
    include: {
      sender:   { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take:    200,
  })

  // Deduplicate: keep only the most recent message per conversation partner
  const seen    = new Set<string>()
  const threads: typeof allMessages = []

  for (const m of allMessages) {
    const partnerId = m.senderId === auth.userId ? m.receiverId : m.senderId
    if (!seen.has(partnerId)) {
      seen.add(partnerId)
      threads.push(m)
    }
    if (threads.length >= limit) break
  }

  // Unread count
  const unreadCount = await prisma.message.count({
    where: { receiverId: auth.userId, read: false },
  })

  const data = threads.map((m) => {
    const isMine  = m.senderId === auth.userId
    const partner = isMine ? m.receiver : m.sender
    return {
      id:        m.id,
      content:   m.content,
      read:      m.read,
      isMine,
      createdAt: m.createdAt.toISOString(),
      partner,
    }
  })

  return NextResponse.json({ data, meta: { unreadCount } })
}

// ── POST /api/messages — send a message (body-based alternative) ─────────────

export async function POST(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Import lazily to avoid circular refs
  const { rateLimit: rl, rateLimitResponse: rlRes, MESSAGE_LIMIT } = await import('@/lib/rateLimit')
  const { sanitizeMessage } = await import('@/lib/sanitize')

  const limit = rl(`messages:${auth.userId}`, MESSAGE_LIMIT)
  if (!limit.ok) return rlRes(limit)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { recipientId, content } = body
  if (!recipientId || typeof recipientId !== 'string') {
    return NextResponse.json({ error: 'recipientId is required' }, { status: 400 })
  }
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  const safeContent = sanitizeMessage(content, 2000)
  if (!safeContent.trim()) {
    return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
  }

  if (recipientId === auth.userId) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
  }

  const conn = auth.role === 'ADMIN' ? { id: 'admin' } : await prisma.connectionRequest.findFirst({
    where:  { status: 'ACCEPTED', OR: [{ senderId: auth.userId, receiverId: recipientId }, { senderId: recipientId, receiverId: auth.userId }] },
    select: { id: true },
  })
  if (!conn) {
    return NextResponse.json({ error: 'You can only message users you have an accepted connection with.' }, { status: 403 })
  }

  const message = await prisma.message.create({
    data: { senderId: auth.userId, receiverId: recipientId, content: safeContent },
  })

  return NextResponse.json({ data: { ...message, createdAt: message.createdAt.toISOString() } }, { status: 201 })
}
