import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

const patchSchema = z.object({
  active:   z.boolean().optional(),
  verified: z.boolean().optional(),
  role:     z.enum(['BUSINESS_OWNER', 'INVESTOR', 'BUYER', 'BUSINESS_EXPERT', 'ADMIN']).optional(),
})

/** PUT /api/admin/users/:id — suspend/unsuspend, verify, change role */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (id === auth.userId) {
    return NextResponse.json({ error: 'Admins cannot modify their own account.' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where:  { id },
    data:   parsed.data,
    select: { id: true, name: true, active: true, verified: true, role: true },
  })

  const action =
    parsed.data.active === false ? 'suspended' :
    parsed.data.active === true  ? 'reactivated' :
    parsed.data.verified === true? 'verified' :
    'updated'

  return NextResponse.json({ data: updated, message: `User "${target.name}" has been ${action}.` })
}

/** DELETE /api/admin/users/:id — permanently delete a user and all their data */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (id === auth.userId) {
    return NextResponse.json({ error: 'Admins cannot delete their own account.' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Cascade is handled by Prisma (onDelete: Cascade on all relations)
  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ message: `User "${target.name}" and all associated data have been permanently deleted.` })
}
