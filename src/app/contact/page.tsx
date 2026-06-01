import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { ContactForm } from '@/components/pages/ContactForm'
import { getAuthUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Contact Us | Finvest',
  description: 'Get in touch with the Finvest team. Support, partnerships, or general enquiries.',
}

const CONTACT_METHODS = [
  {
    icon: '📧',
    label: 'Email Support',
    value: 'support@finvest.pk',
    desc: 'Response within 24–48 business hours',
    href: 'mailto:support@finvest.pk',
    color: '#A78BFA',
    bg:   'rgba(139,92,246,0.1)',
  },
  {
    icon: '🤝',
    label: 'Partnerships',
    value: 'partners@finvest.pk',
    desc: 'Enterprise accounts, B2B integrations',
    href: 'mailto:partners@finvest.pk',
    color: '#34D399',
    bg:   'rgba(16,185,129,0.1)',
  },
  {
    icon: '🏢',
    label: 'Head Office',
    value: 'Blue Area, Islamabad',
    desc: 'F-7/3, Islamabad Capital Territory, Pakistan',
    href: null,
    color: '#60A5FA',
    bg:   'rgba(59,130,246,0.1)',
  },
  {
    icon: '📍',
    label: 'Regional Office',
    value: 'Clifton, Karachi',
    desc: 'Block 5, Clifton, Karachi, Sindh, Pakistan',
    href: null,
    color: '#FCD34D',
    bg:   'rgba(245,158,11,0.1)',
  },
]

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border:     '1px solid rgba(255,255,255,0.09)',
  borderRadius: '1.5rem',
}

export default async function ContactPage() {
  const auth = await getAuthUser()

  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <Navbar user={auth as any} />

      {/* Hero */}
      <section className="relative px-4 py-20 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full pointer-events-none"
             style={{ filter: 'blur(100px)', background: 'rgba(107,33,168,0.18)' }} />
        <div className="relative max-w-xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-3">Get in touch</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-foreground mb-4">Contact Us</h1>
          <p className="text-fg-2 text-base">
            Have a question, problem, or partnership idea? We&apos;re happy to hear from you.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="px-4 pb-20 page-container">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Contact form ────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="p-7 rounded-3xl" style={glass}>
              <h2 className="font-display font-bold text-xl text-foreground mb-6">Send a Message</h2>
              <ContactForm />
            </div>
          </div>

          {/* ── Contact info ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {CONTACT_METHODS.map((m) => (
              <div key={m.label} className="p-5 rounded-3xl flex gap-4 items-start" style={glass}>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: m.bg }}
                >
                  {m.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-fg-3 mb-0.5">{m.label}</p>
                  {m.href ? (
                    <a href={m.href} className="font-semibold text-sm transition-colors"
                       style={{ color: m.color }}>
                      {m.value}
                    </a>
                  ) : (
                    <p className="font-semibold text-sm text-foreground">{m.value}</p>
                  )}
                  <p className="text-xs text-fg-3 mt-0.5">{m.desc}</p>
                </div>
              </div>
            ))}

            {/* Business hours */}
            <div className="p-5 rounded-3xl" style={glass}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-fg-3 mb-3">Business Hours</p>
              <div className="space-y-2 text-sm">
                {[
                  { days: 'Monday – Friday', time: '9:00 AM – 6:00 PM PKT' },
                  { days: 'Saturday',         time: '10:00 AM – 2:00 PM PKT' },
                  { days: 'Sunday',           time: 'Closed' },
                ].map((row) => (
                  <div key={row.days} className="flex justify-between">
                    <span className="text-fg-2">{row.days}</span>
                    <span className="text-fg-3 text-xs">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-2xl"
                 style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <p className="text-xs text-amber-200/70 leading-relaxed">
                <span className="font-semibold text-amber-400">⚠ Disclaimer: </span>
                Finvest does not provide investment advice. Support queries are limited to platform
                use only. We cannot comment on specific investment opportunities or financial decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
