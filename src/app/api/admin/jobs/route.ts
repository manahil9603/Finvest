import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

const employmentValues = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const

const createSchema = z.object({
  title:          z.string().min(2).max(200),
  department:     z.string().max(120).optional().nullable(),
  location:       z.string().min(1).max(200),
  description:    z.string().min(10),
  employmentType: z.enum(employmentValues),
  active:         z.boolean().optional().default(true),
  applyEmail:     z
    .union([z.string().email(), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
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

/** GET /api/admin/jobs — list all postings (draft + live) */
export async function GET(_req: NextRequest) {
  const auth = getAuthUserFromRequest(_req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ jobs: jobs.map(serial) })
}

/** POST /api/admin/jobs — create posting */
export async function POST(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const { department, applyEmail, ...rest } = parsed.data
  const row = await prisma.jobPosting.create({
    data: {
      ...rest,
      department: department?.trim() || null,
      applyEmail: applyEmail ?? null,
    },
  })

  return NextResponse.json({ job: serial(row) })
}
