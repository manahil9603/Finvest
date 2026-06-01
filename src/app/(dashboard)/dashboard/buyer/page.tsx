import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { computeTrustScore } from '@/lib/trust'
import { BuyerShell } from '@/components/dashboard/buyer/BuyerShell'

export const metadata: Metadata = { title: 'Buyer Dashboard' }

const OWNER_SELECT = {
  id: true, name: true, role: true, verified: true,
  city: true, province: true, phone: true, bio: true,
} as const

export default async function BuyerDashboardPage() {
  // Role-protected: BUYER only (ADMIN can view)
  const auth = await requireAuth(['BUYER', 'ADMIN'])

  const user = await prisma.user.findUnique({
    where:  { id: auth.userId },
    select: { id: true, name: true, city: true, verified: true },
  })
  if (!user) redirect('/login')

  // ── Parallel data fetches ──────────────────────────────────────────────────

  const [savedIds, forSaleRaw, acquisitions, allMessages] = await Promise.all([
    // Saved business IDs for this user
    prisma.savedBusiness.findMany({
      where:  { userId: auth.userId },
      select: { businessId: true },
    }),

    // Businesses explicitly open to acquisition (sorted by trust, featured first)
    prisma.business.findMany({
      where: {
        status:      'ACTIVE',
        listingType: 'ACQUISITION',
        ownerId:     { not: auth.userId },
      },
      include: {
        owner:  { select: OWNER_SELECT },
        _count: { select: { connections: true, savedBy: true } },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 48,   // over-fetch; sort by trust and trim
    }),

    // Outgoing acquisition connection requests
    prisma.connectionRequest.findMany({
      where:   { senderId: auth.userId, type: 'BUYING' },
      include: {
        business: { select: { id: true, title: true, industry: true, city: true, askingPrice: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),

    // All messages involving this user
    prisma.message.findMany({
      where: { OR: [{ receiverId: auth.userId }, { senderId: auth.userId }] },
      include: {
        sender:   { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  const savedSet = new Set(savedIds.map((s) => s.businessId))

  // ── Saved businesses (full details) ───────────────────────────────────────
  const savedRows = await prisma.savedBusiness.findMany({
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
  })

  // ── Process businesses for sale ───────────────────────────────────────────
  const forSaleScored = forSaleRaw
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b) => ({ ...b, trustScore: computeTrustScore(b as any), isSaved: savedSet.has(b.id) }))
    .sort((a, c) => c.trustScore - a.trustScore)
    .slice(0, 16)

  // ── Build inbox ───────────────────────────────────────────────────────────
  const seen    = new Set<string>()
  const threads = allMessages
    .map((m) => {
      const isMine  = m.senderId === auth.userId
      const partner = isMine ? m.receiver : m.sender
      return { ...m, isMine, partner }
    })
    .filter(({ partner }) => { if (seen.has(partner.id)) return false; seen.add(partner.id); return true })
    .slice(0, 8)

  // ── Serialise ─────────────────────────────────────────────────────────────
  const serialisedForSale = forSaleScored.map((b) => ({
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

  const serialisedAcquisitions = acquisitions.map((a) => ({
    ...a,
    createdAt:   a.createdAt.toISOString(),
    updatedAt:   a.updatedAt.toISOString(),
    business: {
      ...a.business,
      askingPrice: a.business.askingPrice != null ? Number(a.business.askingPrice) : null,
    },
  }))

  const serialisedMessages = threads.map((m) => ({
    id:        m.id,
    content:   m.content,
    read:      m.read,
    isMine:    m.isMine,
    createdAt: m.createdAt.toISOString(),
    partner:   m.partner,
  }))

  const unreadMessages   = allMessages.filter((m) => m.receiverId === auth.userId && !m.read).length
  const pendingCount     = acquisitions.filter((a) => a.status === 'PENDING').length
  const totalAcquisitions= acquisitions.filter((a) => a.status === 'ACCEPTED').length

  return (
    <BuyerShell
      user={user}
      forSale={serialisedForSale as never}
      saved={serialisedSaved as never}
      acquisitions={serialisedAcquisitions as never}
      messages={serialisedMessages}
      stats={{
        totalSaved:       savedRows.length,
        totalAcquisitions,
        pendingCount,
        unreadMessages,
      }}
    />
  )
}
