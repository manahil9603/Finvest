'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'

interface CTABannerProps {
  isLoggedIn: boolean
}

export function CTABanner({ isLoggedIn }: CTABannerProps) {
  const ref    = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="relative py-20 sm:py-32 px-4 overflow-hidden">
      {/* Layered gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 90% at 50% 50%, rgba(107,33,168,0.35) 0%, rgba(16,185,129,0.1) 50%, transparent 80%)',
          }}
        />
        {/* Animated orbs */}
        <motion.div
          className="absolute left-1/4 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
          style={{ filter: 'blur(100px)', background: 'rgba(107,33,168,0.4)' }}
          animate={{ scale: [1, 1.3, 1], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-1/4 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
          style={{ filter: 'blur(100px)', background: 'rgba(16,185,129,0.25)' }}
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top divider */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(16,185,129,0.3), transparent)' }}
      />

      <div className="page-container text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Label */}
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-5">
            Ready to get started?
          </p>

          {/* Headline */}
          <h2
            className="font-display font-black text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight mb-5"
            style={{ maxWidth: '720px', margin: '0 auto 1.25rem' }}
          >
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 35%, #10B981 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Your next deal
            </span>
            <br />
            <span className="text-foreground">starts here.</span>
          </h2>

          {/* Sub-copy */}
          <p
            className="text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Join 500+ entrepreneurs, investors, and acquirers already building their future
            on Pakistan&apos;s leading SME investment platform.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col xs:flex-row items-center justify-center gap-4 mb-10">
            {isLoggedIn ? (
              <>
                <Link
                  href="/explore"
                  className="px-8 py-4 rounded-2xl font-semibold text-base text-white transition-all hover:-translate-y-0.5 w-full xs:w-auto"
                  style={{
                    background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
                    boxShadow: '0 4px 20px rgba(107,33,168,0.5)',
                  }}
                >
                  Browse Opportunities
                </Link>
                <Link
                  href="/listings/new"
                  className="px-8 py-4 rounded-2xl font-semibold text-base text-foreground transition-all hover:-translate-y-0.5 w-full xs:w-auto"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  List Your Business
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="px-8 py-4 rounded-2xl font-semibold text-base text-white transition-all hover:-translate-y-0.5 w-full xs:w-auto"
                  style={{
                    background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
                    boxShadow: '0 4px 20px rgba(107,33,168,0.5)',
                  }}
                >
                  Create Free Account
                </Link>
                <Link
                  href="/explore"
                  className="px-8 py-4 rounded-2xl font-semibold text-base text-foreground transition-all hover:-translate-y-0.5 w-full xs:w-auto"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  Explore Listings
                </Link>
              </>
            )}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['No registration fee', 'No commission', 'Verified profiles', 'Direct messaging', '7 provinces'].map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {f}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
