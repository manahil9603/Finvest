import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DashboardShell } from '@/components/dashboard/business/DashboardShell'
import type { ChartDay } from '@/components/dashboard/business/AnalyticsChart'

export const metadata: Metadata = { title: 'Business Dashboard' }

// ── Helper: last 7 days of connection request counts ─────────────────────────

async function getChartData(userId: string): Promise<ChartDay[]> {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  return Promise.all(
    days.map(async (date) => {
      const start = new Date(date); start.setHours(0, 0, 0, 0)
      const end   = new Date(date); end.setHours(23, 59, 59, 999)

      const count = await prisma.connectionRequest.count({
        where: { receiverId: userId, createdAt: { gte: start, lte: end } },
      })

      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date:  date.toISOString().split('T')[0],
        count,
      }
    })
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BusinessDashboardPage() {
  // Role-protected: BUSINESS_OWNER only
  const auth = await requireAuth(['BUSINESS_OWNER'])

  const user = await prisma.user.findUnique({
    where:  { id: auth.userId },
    select: { id: true, name: true, city: true, verified: true },
  })
  if (!user) redirect('/login')

  const [businesses, connections, messages, chartData] = await Promise.all([
    // All businesses owned by this user
    prisma.business.findMany({
      where:   { ownerId: auth.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { verified: true, phone: true, bio: true } },
      },
    }),

    // Incoming connection requests (to this user's businesses)
    prisma.connectionRequest.findMany({
      where:   { receiverId: auth.userId },
      include: {
        sender:   { select: { id: true, name: true, role: true, verified: true } },
        business: { select: { id: true, title: true, industry: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:    50,
    }),

    // Recent messages received
    prisma.message.findMany({
      where:   { receiverId: auth.userId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take:    10,
    }),

    getChartData(auth.userId),
  ])

  // Serialise Decimal → number, Date → string
  const serialisedBusinesses = businesses.map((b) => ({
    ...b,
    askingPrice: b.askingPrice != null ? Number(b.askingPrice) : null,
    revenue:     b.revenue     != null ? Number(b.revenue)     : null,
    profit:      b.profit      != null ? Number(b.profit)      : null,
    createdAt:   b.createdAt.toISOString(),
    updatedAt:   b.updatedAt.toISOString(),
  }))

  const serialisedConnections = connections.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  const serialisedMessages = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))

  const pendingCount    = connections.filter((c) => c.status === 'PENDING').length
  const totalConnections= connections.filter((c) => c.status === 'ACCEPTED').length
  const unreadMessages  = messages.filter((m) => !m.read).length

  return (
    <DashboardShell
      user={user}
      businesses={serialisedBusinesses}
      connections={serialisedConnections}
      messages={serialisedMessages}
      chartData={chartData}
      stats={{
        totalBusinesses:  businesses.length,
        totalConnections,
        pendingCount,
        unreadMessages,
      }}
    />
  )
}
