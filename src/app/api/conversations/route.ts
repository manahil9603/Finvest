import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [currentUser, messages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, role: true },
    }),
    prisma.message.findMany({
      where: {
        OR: [{ senderId: auth.userId }, { receiverId: auth.userId }],
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const threads = new Map<string, {
    id: string
    updatedAt: Date
    participants: { user: { id: string; name: string; role: string } }[]
    messages: typeof messages
  }>()

  for (const message of messages) {
    const partner = message.senderId === auth.userId ? message.receiver : message.sender
    if (!threads.has(partner.id)) {
      threads.set(partner.id, {
        id: partner.id,
        updatedAt: message.createdAt,
        participants: [{ user: currentUser ?? message.sender }, { user: partner }],
        messages: [message],
      })
    }
  }

  return NextResponse.json({ data: Array.from(threads.values()) })
}

export async function POST(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipientId, message } = await req.json()
  if (!recipientId || !message?.trim()) {
    return NextResponse.json({ error: 'recipientId and message required' }, { status: 400 })
  }

  if (recipientId === auth.userId) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
  }

  const created = await prisma.message.create({
    data: {
      content: message.trim(),
      senderId: auth.userId,
      receiverId: recipientId,
    },
    include: { sender: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ data: { conversationId: recipientId, message: created } }, { status: 201 })
}
