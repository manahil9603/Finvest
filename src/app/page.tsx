import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Hero } from '@/components/home/Hero'
import { HomeAutoScroll } from '@/components/home/HomeAutoScroll'
import { Stats } from '@/components/home/Stats'
import { FeaturedGrid } from '@/components/home/FeaturedGrid'
import { HowItWorks } from '@/components/home/HowItWorks'
import { Testimonials } from '@/components/home/Testimonials'
import { CTABanner } from '@/components/home/CTABanner'
import type { Business } from '@/types'

// Floor values guarantee the page looks populated in demo/staging.
// In production these update to real counts once they're exceeded.
const STAT_FLOORS = { businesses: 500, investors: 200, cities: 45, connections: 1200 }

async function getFeaturedBusinesses() {
  const raw = await prisma.business.findMany({
    where:   { status: 'ACTIVE' },
    include: {
      owner: { select: { id: true, name: true, role: true, verified: true, city: true } },
      _count: { select: { connections: true, savedBy: true } },
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: 12,
  })

  // Serialise Prisma Decimal + Date before passing to client components
  return raw.map((b) => ({
    ...b,
    askingPrice: b.askingPrice != null ? Number(b.askingPrice) : null,
    revenue:     b.revenue     != null ? Number(b.revenue)     : null,
    profit:      b.profit      != null ? Number(b.profit)      : null,
    createdAt:   b.createdAt.toISOString(),
    updatedAt:   b.updatedAt.toISOString(),
  }))
}

async function getPlatformStats() {
  const [bizCount, investorCount, connections, cityRows] = await Promise.all([
    prisma.business.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: { in: ['INVESTOR', 'BUYER'] } } }),
    prisma.connectionRequest.count({ where: { status: 'ACCEPTED' } }),
    prisma.business.findMany({ where: { status: 'ACTIVE' }, select: { city: true }, distinct: ['city'] }),
  ])

  return {
    businesses:  Math.max(bizCount,           STAT_FLOORS.businesses),
    investors:   Math.max(investorCount,       STAT_FLOORS.investors),
    cities:      Math.max(cityRows.length,     STAT_FLOORS.cities),
    connections: Math.max(connections,         STAT_FLOORS.connections),
  }
}

export const metadata = {
  title: 'Finvest – Discover, Invest & Acquire Rising Pakistani Businesses',
}

export default async function HomePage() {
  const [auth, businesses, stats] = await Promise.all([
    getAuthUser(),
    getFeaturedBusinesses(),
    getPlatformStats(),
  ])

  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
      <Disclaimer />
      <Navbar user={auth} />
      <main>
        <HomeAutoScroll />
        <Hero isLoggedIn={!!auth} />
        <FeaturedGrid businesses={businesses as unknown as Business[]} isLoggedIn={!!auth} />
        <Stats stats={stats} />
        <HowItWorks />
        <Testimonials />
        <CTABanner isLoggedIn={!!auth} />
      </main>
      <Footer />
    </div>
  )
}
