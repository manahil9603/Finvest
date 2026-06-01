import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata: Metadata = { title: 'Admin — Control Centre' }

// ── Helpers ───────────────────────────────────────────────────────────────────

function weekBoundaries(n = 8) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - i) * 7)
    d.setHours(0, 0, 0, 0)
    return d
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  await requireAuth(['ADMIN'])

  const boundaries = weekBoundaries(8)

  const [
    overview,
    pendingRaw,
    usersRaw,
    userTotal,
    userWeekly,
    bizWeekly,
    connWeekly,
  ] = await Promise.all([
    // ── Overview counts ──────────────────────────────────────────
    Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.connectionRequest.count(),
      prisma.business.count({ where: { status: 'DRAFT' } }),
      prisma.user.count({ where: { active: false } }),
      prisma.business.count({ where: { status: 'ACTIVE' } }),
      prisma.connectionRequest.count({ where: { status: 'ACCEPTED' } }),
    ]),

    // ── Pending DRAFT businesses ─────────────────────────────────
    prisma.business.findMany({
      where:   { status: 'DRAFT' },
      include: {
        owner: { select: { id: true, name: true, email: true, verified: true, phone: true, bio: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:    50,
    }),

    // ── Users (first page) ───────────────────────────────────────
    prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        city: true, province: true, verified: true, active: true, createdAt: true,
        _count: { select: { businesses: true, sentConnections: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:    25,
    }),

    prisma.user.count(),

    // ── Weekly timeseries (all three in parallel) ────────────────
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

  const [totalUsers, totalBusinesses, totalConnections, pendingVerifications,
         suspendedUsers, activeBusinesses, acceptedConnections] = overview

  // Serialise
  const pendingSerial = pendingRaw.map((b) => ({
    ...b,
    askingPrice: b.askingPrice != null ? Number(b.askingPrice) : null,
    revenue:     b.revenue     != null ? Number(b.revenue)     : null,
    profit:      b.profit      != null ? Number(b.profit)      : null,
    createdAt:   b.createdAt.toISOString(),
  }))

  const usersSerial = usersRaw.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  const weekLabels = boundaries.slice(0, -1).map((d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  )

  return (
    <AdminShell
      stats={{
        totalUsers, totalBusinesses, totalConnections,
        pendingVerifications, suspendedUsers, activeBusinesses, acceptedConnections,
      }}
      pending={pendingSerial as never}
      users={usersSerial as never}
      userTotal={userTotal}
      charts={{ labels: weekLabels, userGrowth: userWeekly, listingTrends: bizWeekly, connMetrics: connWeekly }}
    />
  )
}
