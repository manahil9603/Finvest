import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: partnerId } = await params
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: auth.userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: auth.userId },
      ],
    },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: auth.userId, read: false },
    data: { read: true },
  })

  return NextResponse.json({ data: messages })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: partnerId } = await params
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (partnerId === auth.userId) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
  }

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      senderId: auth.userId,
      receiverId: partnerId,
    },
    include: { sender: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ data: message }, { status: 201 })
}
