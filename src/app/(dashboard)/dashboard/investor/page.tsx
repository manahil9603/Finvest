import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { computeTrustScore } from '@/lib/trust'
import { InvestorShell } from '@/components/dashboard/investor/InvestorShell'

export const metadata: Metadata = { title: 'Investor Dashboard' }

// ── Helpers ───────────────────────────────────────────────────────────────────

const OWNER_SELECT = {
  id: true, name: true, role: true, verified: true,
  city: true, province: true, phone: true, bio: true,
} as const

async function getRecommended(userId: string, profile: {
  preferredIndustries: string[]
  preferredProvinces:  string[]
  minInvestment:       unknown
  maxInvestment:       unknown
} | null) {
  const where: Record<string, unknown> = {
    status:  'ACTIVE',
    ownerId: { not: userId },
  }

  const pref = profile?.preferredIndustries ?? []
  const prov = profile?.preferredProvinces  ?? []
  const min  = profile?.minInvestment != null ? Number(profile.minInvestment) : null
  const max  = profile?.maxInvestment != null ? Number(profile.maxInvestment) : null

  if (pref.length > 0) where.industry    = { in: pref }
  if (prov.length > 0) where.province    = { in: prov }
  if (min)             where.askingPrice = { ...(where.askingPrice as object ?? {}), gte: min }
  if (max)             where.askingPrice = { ...(where.askingPrice as object ?? {}), lte: max }

  const businesses = await prisma.business.findMany({
    where,
    include: { owner: { select: OWNER_SELECT }, _count: { select: { connections: true, savedBy: true } } },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: 36,
  })

  const savedIds = new Set(
    (await prisma.savedBusiness.findMany({ where: { userId }, select: { businessId: true } })).map((s) => s.businessId)
  )

  return businesses
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b) => ({ ...b, trustScore: computeTrustScore(b as any), isSaved: savedIds.has(b.id) }))
    .sort((a, c) => c.trustScore - a.trustScore)
    .slice(0, 12)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function InvestorDashboardPage() {
  const auth = await requireAuth(['INVESTOR', 'ADMIN'])

  const user = await prisma.user.findUnique({
    where:  { id: auth.userId },
    select: { id: true, name: true, city: true, verified: true },
  })
  if (!user) redirect('/login')

  const [profile, savedRows, connections, allMessages] = await Promise.all([
    prisma.investorProfile.findUnique({ where: { userId: auth.userId } }),

    prisma.savedBusiness.findMany({
      where:   { userId: auth.userId },
      include: {
        business: {
          include: {
            owner:  { select: OWNER_SELECT },
            _count: { select: { connections: true, savedBy: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    prisma.connectionRequest.findMany({
      where:   { senderId: auth.userId },
      include: { business: { select: { id: true, title: true, industry: true, city: true } }, receiver: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take:    30,
    }),

    prisma.message.findMany({
      where:   { OR: [{ receiverId: auth.userId }, { senderId: auth.userId }] },
      include: {
        sender:   { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:    100,
    }),
  ])

  // Build inbox: latest message per conversation partner
  const seen    = new Set<string>()
  const threads = allMessages
    .map((m) => {
      const isMine  = m.senderId === auth.userId
      const partner = isMine ? m.receiver : m.sender
      return { ...m, isMine, partner }
    })
    .filter(({ partner }) => {
      if (seen.has(partner.id)) return false
      seen.add(partner.id)
      return true
    })
    .slice(0, 8)

  const recommended = await getRecommended(auth.userId, profile as Parameters<typeof getRecommended>[1])

  // Serialise
  const serialisedProfile = profile ? {
    id:                 profile.id,
    minInvestment:      profile.minInvestment != null ? Number(profile.minInvestment) : null,
    maxInvestment:      profile.maxInvestment != null ? Number(profile.maxInvestment) : null,
    preferredIndustries: profile.preferredIndustries as string[],
    preferredProvinces:  profile.preferredProvinces  as string[],
    investmentThesis:   profile.investmentThesis,
    portfolioSize:      profile.portfolioSize,
    accredited:         profile.accredited,
  } : null

  const serialisedRecommended = recommended.map((b) => ({
    ...b,
    askingPrice: b.askingPrice != null ? Number(b.askingPrice) : null,
    revenue:     b.revenue     != null ? Number(b.revenue)     : null,
    profit:      b.profit      != null ? Number(b.profit)      : null,
    createdAt:   b.createdAt.toISOString(),
    updatedAt:   b.updatedAt.toISOString(),
  }))

  const serialisedSaved = savedRows.map((row) => ({
    savedId: row.id,
    note:    row.note,
    savedAt: row.createdAt.toISOString(),
    business: {
      ...row.business,
      askingPrice: row.business.askingPrice != null ? Number(row.business.askingPrice) : null,
      revenue:     row.business.revenue     != null ? Number(row.business.revenue)     : null,
      profit:      row.business.profit      != null ? Number(row.business.profit)      : null,
      createdAt:   row.business.createdAt.toISOString(),
      updatedAt:   row.business.updatedAt.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trustScore:  computeTrustScore(row.business as any),
      isSaved:     true,
    },
  }))

  const serialisedConn = connections.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  const serialisedMessages = threads.map((m) => ({
    id:        m.id,
    content:   m.content,
    read:      m.read,
    isMine:    m.isMine,
    createdAt: m.createdAt.toISOString(),
    partner:   m.partner,
  }))

  const unreadMessages  = allMessages.filter((m) => m.receiverId === auth.userId && !m.read).length
  const pendingCount    = connections.filter((c) => c.status === 'PENDING').length
  const totalConnections= connections.filter((c) => c.status === 'ACCEPTED').length

  return (
    <InvestorShell
      user={user}
      profile={serialisedProfile}
      recommended={serialisedRecommended as never}
      saved={serialisedSaved as never}
      connections={serialisedConn}
      messages={serialisedMessages}
      stats={{
        totalSaved:       savedRows.length,
        totalConnections,
        pendingCount,
        unreadMessages,
      }}
    />
  )
}
