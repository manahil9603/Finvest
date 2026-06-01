import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

const schema = z.object({
  status:       z.enum(['ACCEPTED', 'REJECTED']),
  responseNote: z.string().max(500).optional(),
})

/**
 * PUT /api/connections/:id
 *
 * Accept or reject an incoming connection request.
 * Only the receiver (business owner) can call this endpoint.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth   = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const connection = await prisma.connectionRequest.findUnique({ where: { id } })
  if (!connection) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })

  // Only the intended receiver can accept/reject
  if (connection.receiverId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (connection.status !== 'PENDING') {
    return NextResponse.json(
      { error: `Cannot update a ${connection.status.toLowerCase()} request.` },
      { status: 409 }
    )
  }

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const updated = await prisma.connectionRequest.update({
    where: { id },
    data:  { status: parsed.data.status, responseNote: parsed.data.responseNote ?? null },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  })

  return NextResponse.json({
    data: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
    message: parsed.data.status === 'ACCEPTED'
      ? 'Connection accepted! They can now message you.'
      : 'Connection request declined.',
  })
}

/**
 * GET /api/connections/:id — single connection detail
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth   = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const connection = await prisma.connectionRequest.findUnique({
    where:   { id },
    include: {
      sender:   { select: { id: true, name: true, role: true, verified: true } },
      business: { select: { id: true, title: true, industry: true } },
    },
  })

  if (!connection) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (connection.senderId !== auth.userId && connection.receiverId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    data: {
      ...connection,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    },
  })
}
