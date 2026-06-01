'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { ListingCard } from '@/components/listings/ListingCard'
import type { Business } from '@/types'

interface FeaturedGridProps {
  businesses: Business[]
}

export function FeaturedGrid({ businesses }: FeaturedGridProps) {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  if (businesses.length === 0) return null

  return (
    <section className="relative py-16 sm:py-24 px-4" ref={ref}>
      {/* Top glow divider */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), rgba(139,92,246,0.3), transparent)' }}
      />

      <div className="page-container">
        {/* Section header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-2">
              Live listings
            </p>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-2">
              Featured Opportunities
            </h2>
            <p className="text-fg-2 text-sm">
              Hand-picked, verified listings across Pakistan&apos;s fastest-growing industries.
            </p>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 shrink-0"
            style={{
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#A78BFA',
            }}
          >
            View all businesses
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </motion.div>

        {/* Business cards grid — staggered entrance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {businesses.map((biz, i) => (
            <motion.div
              key={biz.id}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay:    0.1 + i * 0.08,
                ease:     [0.16, 1, 0.3, 1],
              }}
            >
              <ListingCard listing={biz} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-base text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
              boxShadow: '0 4px 20px rgba(107,33,168,0.4)',
            }}
          >
            Explore All {businesses.length < 6 ? 'Businesses' : `500+ Businesses`}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
