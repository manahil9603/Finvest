'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'

const STEPS = [
  {
    number: '01',
    icon: '👤',
    title: 'Create Your Profile',
    desc: 'Register as a Business Owner, Investor, or Buyer. Complete your profile with your background, city, and investment criteria. Verified profiles get featured placement.',
    cta:   { label: 'Create free account →', href: '/signup' },
    color: '#8B5CF6',
    glow:  'rgba(139,92,246,0.2)',
    bg:    'rgba(139,92,246,0.1)',
    border:'rgba(139,92,246,0.2)',
  },
  {
    number: '02',
    icon: '🔍',
    title: 'Browse or List',
    desc: 'Business owners post listings with financials, highlights, and photos. Investors and buyers filter by industry, province, deal size, and business stage to find the right match.',
    cta:   { label: 'Browse listings →', href: '/explore' },
    color: '#10B981',
    glow:  'rgba(16,185,129,0.2)',
    bg:    'rgba(16,185,129,0.08)',
    border:'rgba(16,185,129,0.2)',
  },
  {
    number: '03',
    icon: '🤝',
    title: 'Connect & Close',
    desc: 'Send a connection request with your introduction message. Chat directly on the platform — real-time or async. All negotiations and agreements happen between you, offline. Finvest just connects.',
    cta:   null,
    color: '#3B82F6',
    glow:  'rgba(59,130,246,0.2)',
    bg:    'rgba(59,130,246,0.08)',
    border:'rgba(59,130,246,0.2)',
  },
] as const

export function HowItWorks() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section
      className="relative py-16 sm:py-28 px-4"
      ref={ref}
      style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(107,33,168,0.04) 50%, transparent 100%)',
      }}
    >
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

      <div className="page-container">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-3">Simple process</p>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-3">
            How Finvest Works
          </h2>
          <p className="text-fg-2 text-sm max-w-md mx-auto">
            From profile to deal in three transparent steps. No hidden fees, no middlemen.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Connecting line (desktop) */}
          <div
            className="hidden lg:block absolute top-[3.5rem] left-[calc(16.666%+2rem)] right-[calc(16.666%+2rem)] h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.4), rgba(16,185,129,0.4), rgba(59,130,246,0.4))' }}
          />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Step card */}
              <div
                className="rounded-3xl p-7 h-full flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${step.border}`,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3)`,
                }}
              >
                {/* Number + icon */}
                <div className="flex items-center gap-3 mb-6">
                  {/* Step number chip */}
                  <div
                    className="relative w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-base z-10"
                    style={{ background: step.bg, border: `1px solid ${step.border}`, color: step.color }}
                  >
                    {step.number}
                    {/* Connector dot (desktop) */}
                    <div
                      className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-2 ring-background"
                      style={{ background: step.color }}
                    />
                  </div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display font-bold text-xl text-foreground mb-3">{step.title}</h3>
                <p className="text-sm text-fg-2 leading-relaxed flex-1">{step.desc}</p>

                {/* Optional CTA */}
                {step.cta && (
                  <Link
                    href={step.cta.href}
                    className="mt-5 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
                    style={{ color: step.color }}
                  >
                    {step.cta.label}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Legal note */}
        <motion.p
          className="mt-10 text-center text-xs text-fg-3 max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          ⚠ Finvest only facilitates connections. We do not handle funds, provide financial advice,
          or guarantee any transactions. All parties are responsible for their own due diligence.
        </motion.p>
      </div>
    </section>
  )
}
