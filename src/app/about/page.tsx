import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { getAuthUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'About Finvest | Pakistan\'s SME Investment Marketplace',
  description: 'Learn about Finvest\'s mission to democratise SME investment across Pakistan.',
}

const VALUES = [
  {
    icon: '🔍',
    title: 'Radical Transparency',
    desc: 'Every listing shows self-reported financials, highlights, and a computed trust score. We surface the information investors need — without hiding anything behind gatekeepers.',
    color: '#A78BFA',
    bg:   'rgba(139,92,246,0.1)',
  },
  {
    icon: '⚖️',
    title: 'Equal Access',
    desc: 'A textile mill owner deserves the same audience as a growing startup. Finvest removes geography and network as barriers to investment.',
    color: '#34D399',
    bg:   'rgba(16,185,129,0.1)',
  },
  {
    icon: '🛡️',
    title: 'Platform Integrity',
    desc: 'We verify owners, compute trust scores, and review listings before they go live. Zero tolerance for fraudulent or misleading content.',
    color: '#60A5FA',
    bg:   'rgba(59,130,246,0.1)',
  },
  {
    icon: '🤝',
    title: 'Community First',
    desc: "We're building Pakistan's SME ecosystem, not just a transactional platform. Every deal closes one chapter and opens another for the entrepreneur community.",
    color: '#FCD34D',
    bg:   'rgba(245,158,11,0.1)',
  },
]

const TEAM = [
  { name: 'Taha Hassan',   role: 'Founder & Partner', initials: 'TH', grad: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' },
  { name: 'Khayyam Zahid', role: 'Founder & Partner', initials: 'KZ', grad: 'linear-gradient(135deg,#059669,#10B981)' },
]

const MILESTONES = [
  { year: '2024', event: 'Finvest founded' },
  { year: '2024', event: 'First 100 business listings' },
  { year: '2025', event: 'Nationwide platform coverage achieved' },
  { year: '2025', event: 'First 200+ investor profiles' },
  { year: '2026', event: '500+ active listings across 15 industries' },
]

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border:     '1px solid rgba(255,255,255,0.09)',
  borderRadius: '1.5rem',
}

export default async function AboutPage() {
  const auth = await getAuthUser()

  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <Navbar user={auth as any} />

      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden px-4 py-24 sm:py-32 text-center"
        style={{ background: 'linear-gradient(180deg, rgba(107,33,168,0.15) 0%, transparent 100%)' }}
      >
        {/* Ambient orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
             style={{ filter: 'blur(100px)', background: 'rgba(107,33,168,0.25)' }} />

        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-4">Our story</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight mb-6">
            Built for Pakistan&apos;s
            <br />
            <span style={{ backgroundImage: 'linear-gradient(135deg,#A78BFA,#8B5CF6,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              3.2 million SMEs
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-fg-2 leading-relaxed max-w-2xl mx-auto">
            Finvest was founded to bridge the investment gap facing Pakistani entrepreneurs.
            We believe every business owner deserves access to verified investors and strategic buyers —
            regardless of their network, geography, or background.
          </p>
        </div>
      </section>

      {/* ═══ MISSION ═════════════════════════════════════════ */}
      <section className="py-16 px-4 page-container">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-3">Mission</p>
            <h2 className="font-display font-black text-3xl text-foreground mb-5 leading-snug">
              Democratising access to capital for every SME
            </h2>
            <p className="text-fg-2 leading-relaxed mb-4">
              Pakistan&apos;s SME sector contributes 40% of GDP and employs 80% of the non-agricultural
              workforce. Yet the vast majority of these businesses have no structured pathway to
              growth capital or acquisition.
            </p>
            <p className="text-fg-2 leading-relaxed">
              Finvest is the infrastructure layer that connects business owners, investors, and
              buyers directly — eliminating brokers, reducing friction, and creating deals that
              grow Pakistan&apos;s economy.
            </p>
          </div>

          {/* Milestone timeline */}
          <div className="space-y-3">
            {MILESTONES.map((m, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl" style={glass}>
                <div
                  className="text-xs font-black px-2.5 py-1 rounded-lg shrink-0"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}
                >
                  {m.year}
                </div>
                <p className="text-sm text-fg-2 leading-relaxed">{m.event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VALUES ══════════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="page-container">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-3">What we stand for</p>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground">Platform Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="p-6 rounded-3xl flex flex-col" style={glass}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                     style={{ background: v.bg }}>
                  {v.icon}
                </div>
                <h3 className="font-display font-bold text-base text-foreground mb-2">{v.title}</h3>
                <p className="text-xs text-fg-2 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TEAM ════════════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="page-container">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-3">The people behind Finvest</p>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground">Founders & Partners</h2>
            <p className="text-fg-2 text-sm mt-3 max-w-md mx-auto">
              The founders and partners building Finvest to make SME investment and acquisition more accessible across Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            {TEAM.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center p-6 rounded-3xl group transition-all duration-200 hover:-translate-y-1" style={glass}>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-black text-xl text-white mb-3"
                  style={{ background: member.grad }}
                  aria-hidden="true"
                >
                  {member.initials}
                </div>
                <p className="font-semibold text-sm text-foreground leading-tight">{member.name}</p>
                <p className="text-[11px] text-fg-3 mt-1">{member.role}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-fg-3 mt-8">
            We&apos;re hiring!{' '}
            <Link href="/contact" className="font-semibold" style={{ color: '#A78BFA' }}>
              Join the team →
            </Link>
          </p>
        </div>
      </section>

      {/* ═══ LEGAL NOTE ══════════════════════════════════════ */}
      <section className="py-10 px-4">
        <div className="page-container max-w-3xl mx-auto">
          <div className="rounded-3xl p-6 text-center"
               style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <p className="text-sm font-semibold text-amber-400 mb-2">⚠ Legal Disclaimer</p>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              Finvest only facilitates connections between parties. We do not provide financial advice,
              handle funds, or guarantee any transactions or investments. Users are solely responsible
              for their own due diligence.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
