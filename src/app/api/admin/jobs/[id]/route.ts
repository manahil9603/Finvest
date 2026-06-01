import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

const employmentValues = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const

const patchSchema = z.object({
  title:          z.string().min(2).max(200).optional(),
  department:     z.string().max(120).optional().nullable(),
  location:       z.string().min(1).max(200).optional(),
  description:    z.string().min(10).optional(),
  employmentType: z.enum(employmentValues).optional(),
  active:         z.boolean().optional(),
  applyEmail: z.preprocess(
    (v) => (v === '' ? null : v),
    z.union([z.string().email(), z.null()]).optional()
  ),
})

function serial(job: {
  id: string
  title: string
  department: string | null
  location: string
  description: string
  employmentType: string
  active: boolean
  applyEmail: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }
}

/** PATCH /api/admin/jobs/:id */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const incoming = parsed.data
  const data: {
    title?: string
    description?: string
    location?: string
    employmentType?: (typeof employmentValues)[number]
    active?: boolean
    department?: string | null
    applyEmail?: string | null
  } = {}

  if (incoming.title !== undefined) data.title = incoming.title
  if (incoming.description !== undefined) data.description = incoming.description
  if (incoming.location !== undefined) data.location = incoming.location
  if (incoming.employmentType !== undefined) data.employmentType = incoming.employmentType
  if (incoming.active !== undefined) data.active = incoming.active

  if (incoming.department !== undefined) {
    data.department =
      typeof incoming.department === 'string' ? incoming.department.trim() || null : incoming.department
  }
  if (incoming.applyEmail !== undefined) data.applyEmail = incoming.applyEmail

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  try {
    const row = await prisma.jobPosting.update({
      where: { id },
      data,
    })
    return NextResponse.json({ job: serial(row) })
  } catch {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
}

/** DELETE /api/admin/jobs/:id */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    await prisma.jobPosting.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
}
