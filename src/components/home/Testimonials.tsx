'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const TESTIMONIALS = [
  {
    id: 1,
    quote:
      'Found my Series A investor through Finvest in under two weeks. I listed on a Monday, had three serious enquiries by Wednesday, and was on a call with Sara by Friday. The platform is exactly what Pakistan\'s startup ecosystem needed.',
    author:   'Ahmed Khan',
    role:     'Founder, TJ Mart',
    location: 'Lahore, Punjab',
    initials: 'A',
    color:    '#A78BFA',
    bg:       'linear-gradient(135deg, #6B21A8, #8B5CF6)',
    rating:   5,
  },
  {
    id: 2,
    quote:
      'As an angel investor, I used to rely entirely on word-of-mouth to find deals. Finvest gave me access to 50+ verified businesses in one place, with financials already disclosed. I\'ve made two investments through the platform so far.',
    author:   'Sara Malik',
    role:     'Angel Investor (11 investments)',
    location: 'Karachi, Sindh',
    initials: 'S',
    color:    '#34D399',
    bg:       'linear-gradient(135deg, #059669, #10B981)',
    rating:   5,
  },
  {
    id: 3,
    quote:
      'We were looking for a retail acquisition in Punjab. Found TJ Mart on Finvest within days, completed due diligence in three weeks, and closed the deal shortly after. The messaging system made coordination seamless.',
    author:   'Omar Siddiqui',
    role:     'CEO, Siddiqui Holdings',
    location: 'Islamabad, ICT',
    initials: 'O',
    color:    '#60A5FA',
    bg:       'linear-gradient(135deg, #2563EB, #3B82F6)',
    rating:   5,
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

export function Testimonials() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="relative py-16 sm:py-28 px-4" ref={ref}>
      {/* Background flair */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(139,92,246,0.04), transparent)',
        }}
      />

      <div className="page-container relative">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-3">Social proof</p>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-3">
            Deals happen on Finvest
          </h2>
          <p className="text-fg-2 text-sm max-w-md mx-auto">
            From first-time founders to serial acquirers — here&apos;s what our community says.
          </p>
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-3xl p-7 flex flex-col"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
              }}
            >
              {/* Accent top bar */}
              <div
                className="absolute top-0 left-6 right-6 h-[2px] rounded-full pointer-events-none"
                style={{ background: t.bg }}
              />

              {/* Big open-quote mark */}
              <div
                className="text-7xl font-serif leading-none mb-3 -mt-2 select-none"
                style={{ color: t.color, opacity: 0.25 }}
                aria-hidden="true"
              >
                &ldquo;
              </div>

              {/* Stars */}
              <Stars count={t.rating} />

              {/* Quote */}
              <p className="text-sm text-fg-2 leading-relaxed mt-4 mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 mt-auto">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-lg text-white shrink-0"
                  style={{ background: t.bg }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.author}</p>
                  <p className="text-xs text-fg-3 mt-0.5">{t.role}</p>
                  <p className="text-[11px] text-fg-3 mt-0.5 flex items-center gap-1">
                    <span>📍</span>
                    {t.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Platform trust strip */}
        <motion.div
          className="mt-14 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {[
            { value: '4.9/5',  label: 'Average rating' },
            { value: '500+',   label: 'Active listings' },
            { value: '0%',     label: 'Commission fee' },
            { value: '24/7',   label: 'Support available' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="font-display font-black text-2xl mb-0.5"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #A78BFA, #10B981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {s.value}
              </div>
              <div className="text-xs text-fg-3">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
