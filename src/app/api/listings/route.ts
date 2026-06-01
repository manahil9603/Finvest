import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

const createSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20),
  type: z.enum(['INVESTMENT', 'ACQUISITION', 'PARTNERSHIP']),
  stage: z.enum(['IDEA', 'STARTUP', 'GROWING', 'EXPANDING', 'MATURE']).default('STARTUP'),
  industry: z.string(),
  city: z.string().min(2),
  province: z.string(),
  askingPrice: z.number().positive().optional().nullable(),
  revenue: z.number().positive().optional().nullable(),
  profit: z.number().positive().optional().nullable(),
  employees: z.number().int().positive().optional().nullable(),
  established: z.number().int().min(1900).max(2024).optional().nullable(),
  highlights: z.array(z.string()).max(6).default([]),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type')
  const industry = searchParams.get('industry')
  const province = searchParams.get('province')
  const search = searchParams.get('search')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 12

  const where: Record<string, unknown> = { status: 'ACTIVE' }
  if (type) where.listingType = type
  if (industry) where.industry = industry
  if (province) where.province = province
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [listings, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, role: true, verified: true, city: true } },
        _count: { select: { savedBy: true, connections: true } },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.business.count({ where }),
  ])

  return NextResponse.json({
    data: listings,
    meta: { total, page, pages: Math.ceil(total / limit), limit },
  })
}

export async function POST(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { type, ...data } = parsed.data
    const listing = await prisma.business.create({
      data: { ...data, listingType: type, ownerId: auth.userId } as any,
    })

    return NextResponse.json({ data: listing }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
