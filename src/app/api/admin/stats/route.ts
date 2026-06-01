import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

function weekBoundaries(n = 8) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - i) * 7)
    d.setHours(0, 0, 0, 0)
    return d
  })
}

export async function GET(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const boundaries = weekBoundaries(8)

  const [
    totalUsers,
    totalBusinesses,
    totalConnections,
    pendingVerifications,
    suspendedUsers,
    activeBusinesses,
    acceptedConnections,
    // weekly timeseries (8 weeks × 3 models in parallel)
    userWeekly,
    bizWeekly,
    connWeekly,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.connectionRequest.count(),
    prisma.business.count({ where: { status: 'DRAFT' } }),
    prisma.user.count({ where: { active: false } }),
    prisma.business.count({ where: { status: 'ACTIVE' } }),
    prisma.connectionRequest.count({ where: { status: 'ACCEPTED' } }),

    Promise.all(
      boundaries.slice(0, -1).map((start, i) =>
        prisma.user.count({ where: { createdAt: { gte: start, lt: boundaries[i + 1] } } })
      )
    ),
    Promise.all(
      boundaries.slice(0, -1).map((start, i) =>
        prisma.business.count({ where: { createdAt: { gte: start, lt: boundaries[i + 1] } } })
      )
    ),
    Promise.all(
      boundaries.slice(0, -1).map((start, i) =>
        prisma.connectionRequest.count({ where: { createdAt: { gte: start, lt: boundaries[i + 1] } } })
      )
    ),
  ])

  const weekLabels = boundaries.slice(0, -1).map((d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  )

  return NextResponse.json({
    data: {
      overview: {
        totalUsers,
        totalBusinesses,
        totalConnections,
        pendingVerifications,
        suspendedUsers,
        activeBusinesses,
        acceptedConnections,
      },
      charts: {
        labels: weekLabels,
        userGrowth:    userWeekly,
        listingTrends: bizWeekly,
        connMetrics:   connWeekly,
      },
    },
  })
}
