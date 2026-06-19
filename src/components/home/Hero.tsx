'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'

// ── Inline SVGs ───────────────────────────────────────────────────────────────

function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ── Stagger container variants ────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const item = {
  hidden:  { opacity: 0, y: 24 },
  show:    { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

// ── Hero ──────────────────────────────────────────────────────────────────────

interface HeroProps {
  isLoggedIn: boolean
}

export function Hero({ isLoggedIn }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity   = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[94dvh] flex flex-col items-center justify-center overflow-hidden px-4 py-24 sm:py-32"
    >
      {/* ── Background ──────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ y: parallaxY }}
      >
        {/* Base dark */}
        <div className="absolute inset-0 bg-background" />

        {/* Top purple glow */}
        <div
          className="absolute inset-x-0 top-0 h-[70%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 90% 65% at 50% -5%, rgba(107,33,168,0.45) 0%, transparent 70%)',
          }}
        />

        {/* Orb — left */}
        <motion.div
          className="absolute -left-48 top-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ filter: 'blur(130px)', background: 'radial-gradient(circle, rgba(107,33,168,0.3), transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Orb — right */}
        <motion.div
          className="absolute -right-48 bottom-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ filter: 'blur(120px)', background: 'radial-gradient(circle, rgba(16,185,129,0.2), transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Orb — bottom center */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[700px] h-[250px] rounded-full pointer-events-none"
          style={{ filter: 'blur(100px)', background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)' }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </motion.div>

      {/* ── Main content ─────────────────────────────────────── */}
      <motion.div
        className="text-center max-w-4xl mx-auto relative z-10"
        style={{ opacity }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Headline */}
        <motion.h1
          variants={item}
          className="font-display font-black leading-[1.04] tracking-tight mb-7"
          style={{ fontSize: 'clamp(2.4rem, 6.5vw, 5.25rem)' }}
        >
          <span className="text-foreground">Discover, Invest</span>
          <br />
          <span className="text-foreground">&amp; Acquire </span>
          <span
            className="inline-block"
            style={{
              backgroundImage: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 40%, #10B981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Rising Pakistani
          </span>
          <br />
          <span className="text-foreground">Businesses</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={item}
          className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
          style={{ color: 'rgba(255,255,255,0.52)' }}
        >
          Finvest connects verified Pakistani SMEs with investors and acquirers across every
          industry and province — no brokers, no commissions, no middlemen.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={item}
          className="flex flex-col xs:flex-row items-center justify-center gap-3.5"
        >
          <Link
            href={isLoggedIn ? '/listings/new' : '/signup'}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-base text-white transition-all duration-200 hover:-translate-y-0.5 w-full xs:w-auto justify-center"
            style={{
              background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
              boxShadow: '0 4px 20px rgba(107,33,168,0.5), 0 0 0 1px rgba(139,92,246,0.2)',
            }}
          >
            List Your Business
            <ArrowRight />
          </Link>

          <Link
            href={isLoggedIn ? '/explore' : '/login'}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-base text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 w-full xs:w-auto justify-center"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
            }}
          >
            Explore Opportunities
          </Link>
        </motion.div>

        {/* Trust row */}
        <motion.div
          variants={item}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          {[
            { icon: '🔒', text: 'Zero Commission' },
            { icon: '✅', text: 'Verified Profiles' },
            { icon: '⚡', text: 'Direct Connections' },
            { icon: '🛡️', text: 'Secure Messaging' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 6, 0] }}
        transition={{ opacity: { delay: 2.5 }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 2.5 } }}
        style={{ color: 'rgba(255,255,255,0.25)' }}
        aria-hidden="true"
      >
        <ChevronDown />
      </motion.div>
    </section>
  )
}
