import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

const schema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  note:   z.string().max(500).optional(),
})

/**
 * PUT /api/admin/verify/:businessId
 *
 * APPROVE → status = ACTIVE  (business goes live)
 * REJECT  → status = CLOSED  (business removed from marketplace)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const auth = getAuthUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { businessId } = await params

  const business = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { id: true, status: true, title: true },
  })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const newStatus = parsed.data.action === 'APPROVE' ? 'ACTIVE' : 'CLOSED'

  const updated = await prisma.business.update({
    where: { id: businessId },
    data:  { status: newStatus },
    select: { id: true, status: true, title: true },
  })

  return NextResponse.json({
    data:    updated,
    message: parsed.data.action === 'APPROVE'
      ? `"${business.title}" approved and is now live.`
      : `"${business.title}" has been rejected.`,
  })
}
