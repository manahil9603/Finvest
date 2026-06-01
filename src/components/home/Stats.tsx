'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

// ── Animated counter ──────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, inView: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed  = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [inView, target, duration])

  return count
}

// ── Single stat card ──────────────────────────────────────────────────────────

interface StatCardProps {
  value:    number
  suffix:   string
  label:    string
  icon:     string
  color:    string
  glow:     string
  bg:       string
  delay:    number
  inView:   boolean
}

function StatCard({ value, suffix, label, icon, color, glow, bg, delay, inView }: StatCardProps) {
  const count = useCountUp(value, 2000, inView)

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl p-7 flex flex-col items-center text-center overflow-hidden group"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
        style={{ background: `radial-gradient(ellipse 80% 80% at 50% 50%, ${glow}, transparent)` }}
      />

      {/* Icon chip */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 relative z-10"
        style={{ background: bg, border: `1px solid ${color}30` }}
      >
        {icon}
      </div>

      {/* Number */}
      <div
        className="font-display font-black text-4xl sm:text-5xl mb-1.5 relative z-10 tabular-nums"
        style={{
          backgroundImage: `linear-gradient(135deg, ${color} 0%, white 80%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {count.toLocaleString()}{suffix}
      </div>

      {/* Label */}
      <p className="text-sm text-fg-2 font-medium relative z-10">{label}</p>
    </motion.div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

interface StatsProps {
  stats: {
    businesses:  number
    investors:   number
    cities:      number
    connections: number
  }
}

const STAT_CONFIG = [
  { key: 'businesses',  suffix: '+',  label: 'Verified Businesses',    icon: '🏢', color: '#A78BFA', glow: 'rgba(139,92,246,0.12)',  bg: 'rgba(139,92,246,0.12)'  },
  { key: 'investors',   suffix: '+',  label: 'Active Investors',        icon: '💰', color: '#34D399', glow: 'rgba(16,185,129,0.12)',   bg: 'rgba(16,185,129,0.1)'   },
  { key: 'cities',      suffix: '+',  label: 'Cities Covered',          icon: '📍', color: '#60A5FA', glow: 'rgba(59,130,246,0.12)',   bg: 'rgba(59,130,246,0.1)'   },
  { key: 'connections', suffix: '+',  label: 'Successful Connections',  icon: '🤝', color: '#FCD34D', glow: 'rgba(245,158,11,0.12)',   bg: 'rgba(245,158,11,0.1)'   },
] as const

export function Stats({ stats }: StatsProps) {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative py-16 sm:py-24 px-4" ref={ref}>
      {/* Subtle divider glow */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(16,185,129,0.3), transparent)' }}
      />

      <div className="page-container">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-3">
            Growing fast
          </p>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-3">
            Pakistan&apos;s SME marketplace
            <br className="hidden sm:block" />
            <span
              className="inline"
              style={{
                backgroundImage: 'linear-gradient(135deg, #8B5CF6, #10B981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {' '}is growing fast
            </span>
          </h2>
          <p className="text-fg-2 text-sm max-w-md mx-auto">
            Every day more businesses list, more investors discover deals, and more connections turn into partnerships.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {STAT_CONFIG.map((cfg, i) => (
            <StatCard
              key={cfg.key}
              value={stats[cfg.key]}
              suffix={cfg.suffix}
              label={cfg.label}
              icon={cfg.icon}
              color={cfg.color}
              glow={cfg.glow}
              bg={cfg.bg}
              delay={i * 0.1}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
