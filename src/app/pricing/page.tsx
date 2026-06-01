import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { getAuthUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Pricing | Finvest',
  description: 'Simple, transparent pricing for Pakistani SME owners. Start free, boost when ready.',
}

interface Plan {
  name:        string
  price:       string
  period:      string
  tagline:     string
  highlight:   boolean
  badge?:      string
  color:       string
  borderColor: string
  btnStyle:    React.CSSProperties
  features:    { text: string; included: boolean }[]
  cta:         string
  href:        string
}

const PLANS: Plan[] = [
  {
    name:      'Basic',
    price:     'Free',
    period:    'forever',
    tagline:   'Everything you need to get started on Finvest.',
    highlight: false,
    color:     '#A1A1AA',
    borderColor: 'rgba(255,255,255,0.1)',
    btnStyle:  { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' },
    features: [
      { text: '1 business listing',                included: true  },
      { text: 'Standard search placement',         included: true  },
      { text: 'Full trust score display',          included: true  },
      { text: 'Direct messaging (connections)',    included: true  },
      { text: 'Investor dashboard access',         included: true  },
      { text: '⭐ Featured placement',             included: false },
      { text: 'Priority in recommendations',       included: false },
      { text: 'Analytics dashboard',              included: false },
      { text: 'Priority verification review',      included: false },
      { text: 'Dedicated support',                included: false },
    ],
    cta:  'Get started free',
    href: '/signup',
  },
  {
    name:      'Boost',
    price:     'PKR 5,000',
    period:    '/month',
    tagline:   'Get seen first by investors and buyers.',
    highlight: true,
    badge:     'Most Popular',
    color:     '#A78BFA',
    borderColor: 'rgba(139,92,246,0.5)',
    btnStyle:  { background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', color: '#fff', boxShadow: '0 4px 20px rgba(107,33,168,0.45)' },
    features: [
      { text: '3 business listings',              included: true  },
      { text: 'Standard search placement',        included: true  },
      { text: 'Full trust score display',         included: true  },
      { text: 'Direct messaging (connections)',   included: true  },
      { text: 'Investor dashboard access',        included: true  },
      { text: '⭐ Featured placement in search',  included: true  },
      { text: 'Priority in recommendations',      included: true  },
      { text: 'Analytics dashboard',             included: false },
      { text: 'Priority verification review',     included: false },
      { text: 'Dedicated support',               included: false },
    ],
    cta:  'Start Boost plan',
    href: '/signup',
  },
  {
    name:      'Premium',
    price:     'PKR 15,000',
    period:    '/month',
    tagline:   'For serious owners who want maximum exposure.',
    highlight: false,
    color:     '#34D399',
    borderColor: 'rgba(16,185,129,0.35)',
    btnStyle:  { background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' },
    features: [
      { text: 'Unlimited business listings',      included: true  },
      { text: 'Standard search placement',        included: true  },
      { text: 'Full trust score display',         included: true  },
      { text: 'Direct messaging (connections)',   included: true  },
      { text: 'Investor dashboard access',        included: true  },
      { text: '⭐ Featured placement in search',  included: true  },
      { text: 'Priority in recommendations',      included: true  },
      { text: 'Analytics dashboard (coming soon)',included: true  },
      { text: 'Priority verification review',     included: true  },
      { text: 'Dedicated support channel',        included: true  },
    ],
    cta:  'Start Premium plan',
    href: '/signup',
  },
]

const FAQS = [
  { q: 'Can I cancel my plan anytime?',            a: 'Yes. All paid plans are billed monthly and can be cancelled at any time from your dashboard. No contracts, no cancellation fees.' },
  { q: 'Is there a free trial for paid plans?',   a: 'We do not currently offer a free trial for paid plans, but the Basic plan is free forever and includes full access to the marketplace.' },
  { q: 'What payment methods do you accept?',     a: 'We accept all major Pakistani bank transfers, JazzCash, EasyPaisa, and credit/debit cards. Payment processing is handled securely via third-party providers.' },
  { q: 'Does Finvest take commission on deals?',   a: 'No. Finvest charges zero commission on any deal, investment, or acquisition that originates from a connection made on the platform. Our plans are flat monthly fees only.' },
  { q: 'Can investors and buyers use Finvest for free?', a: 'Yes. The Basic plan is available to all users — including investors and buyers — at no cost. Paid plans are primarily for business owners who want increased visibility.' },
]

const glass: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '1.5rem' }

export default async function PricingPage() {
  const auth = await getAuthUser()

  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <Navbar user={auth as any} />

      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section className="relative px-4 py-24 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full pointer-events-none"
             style={{ filter: 'blur(100px)', background: 'rgba(107,33,168,0.2)' }} />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-4">Simple pricing</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-foreground mb-5">
            Start free.{' '}
            <span style={{ backgroundImage: 'linear-gradient(135deg,#A78BFA,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Boost when ready.
            </span>
          </h1>
          <p className="text-fg-2 text-lg leading-relaxed">
            Zero commission. No hidden fees. Pay only for visibility — not for making deals.
          </p>
        </div>
      </section>

      {/* ═══ PRICING CARDS ═══════════════════════════════════ */}
      <section className="px-4 pb-16 page-container">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-3xl p-7 transition-all duration-200"
              style={{
                background:   plan.highlight ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.04)',
                border:       `1.5px solid ${plan.borderColor}`,
                boxShadow:    plan.highlight ? '0 0 40px rgba(139,92,246,0.15)' : 'none',
              }}
            >
              {/* Most popular badge */}
              {plan.badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', color: '#fff' }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: plan.color }}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="font-display font-black text-3xl" style={{ color: plan.color }}>
                    {plan.price}
                  </span>
                  <span className="text-fg-3 text-sm mb-0.5">{plan.period}</span>
                </div>
                <p className="text-xs text-fg-2 leading-relaxed">{plan.tagline}</p>
              </div>

              {/* CTA */}
              <Link
                href={plan.href}
                className="block text-center py-3 rounded-2xl text-sm font-semibold mb-6 transition-all hover:-translate-y-0.5"
                style={plan.btnStyle}
              >
                {plan.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5">
                    <span
                      className="text-xs shrink-0 mt-0.5 font-bold"
                      style={{ color: f.included ? '#34D399' : 'rgba(255,255,255,0.2)' }}
                    >
                      {f.included ? '✓' : '✕'}
                    </span>
                    <span className={`text-xs leading-relaxed ${f.included ? 'text-fg-2' : 'text-fg-3 line-through'}`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Guarantee strip */}
        <div className="max-w-5xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: '🔓', text: 'No lock-in contracts' },
            { icon: '0%', text: 'Zero deal commission' },
            { icon: '↩', text: 'Cancel anytime' },
          ].map((g) => (
            <div key={g.text} className="py-3 rounded-2xl text-sm text-fg-2 flex items-center justify-center gap-2"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-lg">{g.icon}</span>
              {g.text}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ════════════════════════════════ */}
      <section className="py-12 px-4 page-container">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-black text-2xl text-foreground text-center mb-8">Plan Comparison</h2>

          <div className="rounded-3xl overflow-hidden" style={glass}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-fg-3">Feature</th>
                    {PLANS.map((p) => (
                      <th key={p.name} className="px-6 py-4 text-center text-[11px] font-bold uppercase" style={{ color: p.color }}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Monthly price',     vals: ['Free', 'PKR 5,000', 'PKR 15,000'] },
                    { label: 'Business listings', vals: ['1', '3', 'Unlimited'] },
                    { label: 'Featured placement',vals: ['✕', '✓', '✓'] },
                    { label: 'Priority recs',     vals: ['✕', '✓', '✓'] },
                    { label: 'Analytics',         vals: ['✕', '✕', '✓ (soon)'] },
                    { label: 'Priority verify',   vals: ['✕', '✕', '✓'] },
                    { label: 'Dedicated support', vals: ['✕', '✕', '✓'] },
                    { label: 'Deal commission',   vals: ['0%', '0%', '0%'] },
                  ].map((row, i) => (
                    <tr key={row.label} style={{ borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <td className="px-6 py-3.5 text-xs text-fg-2">{row.label}</td>
                      {row.vals.map((v, vi) => (
                        <td key={vi} className="px-6 py-3.5 text-center text-xs font-semibold"
                            style={{ color: v === '✕' ? 'rgba(255,255,255,0.2)' : v === '✓' || v === '0%' ? '#34D399' : PLANS[vi]!.color }}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING FAQ ═════════════════════════════════════ */}
      <section className="py-12 px-4 page-container">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-black text-2xl text-foreground text-center mb-8">Pricing FAQ</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <div key={faq.q} className="p-5 rounded-2xl" style={glass}>
                <p className="font-semibold text-sm text-foreground mb-2">{faq.q}</p>
                <p className="text-xs text-fg-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DISCLAIMER ══════════════════════════════════════ */}
      <section className="px-4 pb-12">
        <div className="page-container max-w-3xl mx-auto">
          <div className="rounded-2xl p-5"
               style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              <span className="font-semibold text-amber-400">⚠ Legal Disclaimer: </span>
              Finvest subscription plans are for platform visibility only. Purchasing a plan does not guarantee
              investor interest, deal flow, or any financial outcome. Finvest does not provide financial advice,
              handle investment funds, or guarantee any transactions. All parties are solely responsible for
              their own due diligence and investment decisions.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
