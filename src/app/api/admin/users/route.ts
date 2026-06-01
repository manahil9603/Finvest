import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

const PAGE_SIZE = 25

/** GET /api/admin/users — paginated user list with search + role filter */
export async function GET(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sp   = req.nextUrl.searchParams
  const q    = sp.get('q')?.trim()
  const role = sp.get('role')
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'))

  const where: Record<string, unknown> = {}
  if (q) {
    where.OR = [
      { name:  { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (role) where.role = role

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        city:      true,
        province:  true,
        verified:  true,
        active:    true,
        createdAt: true,
        _count:    { select: { businesses: true, sentConnections: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * PAGE_SIZE,
      take:    PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    data: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    meta: { total, page, pages: Math.ceil(total / PAGE_SIZE), limit: PAGE_SIZE },
  })
}
