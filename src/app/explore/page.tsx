import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getAuthUser } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { ExploreClient } from '@/components/explore/ExploreClient'
import { SkeletonGrid } from '@/components/explore/BusinessSkeleton'

export const metadata: Metadata = {
  title: 'Explore Businesses',
  description:
    'Search and filter 500+ verified Pakistani businesses available for investment, acquisition, or partnership.',
}

function ExploreShell() {
  return (
    <div className="page-container py-6">
      <SkeletonGrid count={12} />
    </div>
  )
}

export default async function ExplorePage() {
  const auth = await getAuthUser()

  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <Navbar user={auth as any} />

      {/* Hero banner */}
      <div
        className="relative overflow-hidden border-b"
        style={{
          background: 'linear-gradient(180deg, rgba(107,33,168,0.12) 0%, transparent 100%)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <div className="page-container py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-2">Marketplace</p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-2">
            Explore Businesses
          </h1>
          <p className="text-fg-2 text-sm max-w-xl">
            Search 500+ verified Pakistani SMEs available for investment, acquisition, or partnership.
            Filter by industry, province, stage, and deal size.
          </p>
        </div>
        {/* Ambient glow */}
        <div
          className="absolute right-0 top-0 w-96 h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(16,185,129,0.08), transparent)' }}
        />
      </div>

      <main className="flex-1">
        {/*
          ExploreClient uses useSearchParams() so it must be wrapped in Suspense.
          The fallback shows skeleton cards while the client JS hydrates.
        */}
        <Suspense fallback={<ExploreShell />}>
          <ExploreClient currentUserId={auth?.userId ?? null} />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}
