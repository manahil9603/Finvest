'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'

const ROLES = [
  { key: 'owner',    label: '🏢 Business Owners', color: '#FCD34D', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  { key: 'investor', label: '💰 Investors',        color: '#34D399', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' },
  { key: 'buyer',    label: '🤝 Buyers',           color: '#60A5FA', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)' },
] as const

type RoleKey = 'owner' | 'investor' | 'buyer'

const STEPS: Record<RoleKey, { icon: string; title: string; desc: string; detail: string }[]> = {
  owner: [
    {
      icon: '👤',
      title: 'Create Your Profile',
      desc: 'Sign up as a Business Owner and complete your profile with your background, company details, and credentials.',
      detail: 'A complete profile builds trust with investors. Add your city, bio, phone number, and company name. Verified profiles receive a ✅ badge and a +40 point trust score boost.',
    },
    {
      icon: '📋',
      title: 'List Your Business',
      desc: 'Create a detailed listing with financials, key highlights, industry, location, and up to 5 images.',
      detail: 'Include accurate revenue, profit, and asking price to maximise your trust score. Add key highlights (e.g. "ISO certified", "export contracts") to stand out. Listings are reviewed before going live.',
    },
    {
      icon: '🤝',
      title: 'Review & Connect',
      desc: 'Receive connection requests from verified investors and buyers. Accept or decline — you control every conversation.',
      detail: 'Each request includes an introduction message. Accepted connections unlock direct messaging. Once connected, you negotiate offline — Finvest does not mediate or take commission.',
    },
  ],
  investor: [
    {
      icon: '⚙️',
      title: 'Set Your Preferences',
      desc: 'Define your investment range, preferred industries, provinces, and investment thesis from your dashboard.',
      detail: 'Your preferences power the Recommended Businesses feed on your dashboard. You can update them anytime — recommendations refresh immediately. Mark yourself as SECP-accredited to signal credibility.',
    },
    {
      icon: '🔍',
      title: 'Discover Opportunities',
      desc: 'Browse curated listings filtered to your criteria. Filter by stage, revenue, industry, and trust score.',
      detail: 'Each listing shows a computed Trust Score (0–100) based on financial disclosure, owner verification, and profile completeness. Save businesses to your watchlist and compare multiple opportunities.',
    },
    {
      icon: '💬',
      title: 'Connect & Evaluate',
      desc: 'Send a connection request with your introduction. Once accepted, message owners directly and conduct your due diligence.',
      detail: 'All financial figures are self-reported. Finvest strongly recommends engaging a qualified CA, lawyer, and financial advisor before making any investment decision. We connect — you evaluate.',
    },
  ],
  buyer: [
    {
      icon: '🏢',
      title: 'Browse Acquisitions',
      desc: 'Filter businesses specifically open to acquisition — sorted by trust score, industry, size, and province.',
      detail: 'Only businesses listed as "Open to Acquisition" appear in the buyer feed. Filter by asking price range, revenue, stage, and province to find the right target for your portfolio.',
    },
    {
      icon: '🔖',
      title: 'Build Your Watchlist',
      desc: 'Save promising targets to your watchlist, add private notes, and track multiple acquisition opportunities simultaneously.',
      detail: 'Your acquisition watchlist is private — only you can see it. Add notes like "DD initiated" or "awaiting audited accounts" to keep track of where you are in each process.',
    },
    {
      icon: '📩',
      title: 'Initiate Negotiations',
      desc: 'Send an acquisition enquiry with your introduction. Once accepted, message the owner directly and negotiate terms offline.',
      detail: 'All deal terms, agreements, and financial transactions happen entirely between you and the seller — outside Finvest. Engage your own legal and financial advisors before proceeding to any binding agreement.',
    },
  ],
}

const HOW_WE_HELP = [
  { icon: '✅', title: 'Verified Profiles',    desc: 'Manually reviewed owner accounts with a verified badge.' },
  { icon: '📊', title: 'Trust Scores',         desc: 'Computed 0–100 score based on 7 measurable signals.' },
  { icon: '🔐', title: 'Secure Messaging',     desc: 'Direct messaging only between accepted connections.' },
  { icon: '⚡', title: 'Real-time Updates',    desc: 'Instant notifications for connection requests and messages.' },
  { icon: '0%', title: 'Zero Commission',      desc: 'We charge nothing on deals. No hidden fees.' },
  { icon: '🇵🇰', title: '7 Provinces',          desc: 'Listings across Punjab, Sindh, KPK, Balochistan, and more.' },
]

export default function HowItWorksPage() {
  const [active, setActive] = useState<RoleKey>('owner')
  const [openStep, setOpenStep] = useState<number | null>(null)

  const steps  = STEPS[active]
  const roleCfg = ROLES.find((r) => r.key === active)!

  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <Navbar />

      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section className="relative px-4 py-24 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full pointer-events-none"
             style={{ filter: 'blur(100px)', background: 'rgba(107,33,168,0.2)' }} />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-4">Simple. Transparent. Powerful.</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-foreground mb-5">
            How Finvest Works
          </h1>
          <p className="text-fg-2 text-lg leading-relaxed">
            From first listing to first deal — Finvest guides every type of user through a clear,
            three-step journey. No brokers. No middlemen. No commission.
          </p>
        </div>
      </section>

      {/* ═══ ROLE TABS + STEPS ═══════════════════════════════ */}
      <section className="py-10 px-4 page-container">

        {/* Tab selector */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          {ROLES.map((role) => (
            <button
              key={role.key}
              onClick={() => { setActive(role.key); setOpenStep(null) }}
              className="px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200"
              style={
                active === role.key
                  ? { background: role.bg, color: role.color, border: `1.5px solid ${role.border}` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.09)' }
              }
              aria-pressed={active === role.key}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-3xl p-6 flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: openStep === i ? roleCfg.bg : 'rgba(255,255,255,0.04)',
                  border:     openStep === i ? `1.5px solid ${roleCfg.border}` : '1px solid rgba(255,255,255,0.09)',
                }}
                onClick={() => setOpenStep(openStep === i ? null : i)}
              >
                {/* Step number + icon */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-display font-black text-sm"
                    style={{ background: openStep === i ? `${roleCfg.color}22` : 'rgba(255,255,255,0.07)', color: roleCfg.color }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="text-2xl">{step.icon}</div>
                </div>

                <h3 className="font-display font-bold text-base text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-fg-2 leading-relaxed flex-1">{step.desc}</p>

                {/* Expandable detail */}
                <AnimatePresence>
                  {openStep === i && (
                    <motion.p
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: '12px' }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      className="text-xs text-fg-3 leading-relaxed overflow-hidden"
                      style={{ color: roleCfg.color, opacity: 0.8 }}
                    >
                      {step.detail}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="mt-4 text-[11px]" style={{ color: roleCfg.color }}>
                  {openStep === i ? '▲ Less' : '▼ More details'}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ═══ HOW WE HELP ══════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground">What Finvest Provides</h2>
            <p className="text-fg-2 text-sm mt-2">The infrastructure that makes deals possible.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {HOW_WE_HELP.map((h) => (
              <div key={h.title} className="rounded-2xl p-4 text-center"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-2xl mb-2">{h.icon}</div>
                <p className="font-semibold text-xs text-foreground mb-1">{h.title}</p>
                <p className="text-[11px] text-fg-3 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ════════════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="page-container max-w-2xl mx-auto text-center">
          <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground mb-4">Ready to start?</h2>
          <p className="text-fg-2 text-sm mb-8">Create your free account in under 2 minutes.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="px-8 py-3.5 rounded-2xl text-sm font-semibold text-white w-full sm:w-auto"
                  style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', boxShadow: '0 4px 20px rgba(107,33,168,0.4)' }}>
              Create Free Account
            </Link>
            <Link href="/explore" className="px-8 py-3.5 rounded-2xl text-sm font-semibold text-fg-2 hover:text-foreground transition-colors w-full sm:w-auto"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Browse Businesses
            </Link>
          </div>

          {/* Legal */}
          <div className="mt-10 rounded-2xl p-4"
               style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              <span className="font-semibold text-amber-400">⚠ Disclaimer: </span>
              Finvest only facilitates connections. We do not provide financial advice, handle funds,
              or guarantee any transactions. All parties are solely responsible for their own due diligence.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
