'use client'

import { useEffect, useState } from 'react'
import { getTrustMeta } from '@/lib/trust'

interface TrustMeterProps {
  score:     number
  size?:     number   // SVG canvas size in px (default 148)
  showBreakdown?: boolean
}

const BREAKDOWN_ITEMS = [
  { label: 'Owner verified',       points: 40, key: 'verified'   },
  { label: 'Asking price shown',   points: 15, key: 'asking'     },
  { label: 'Revenue disclosed',    points: 15, key: 'revenue'    },
  { label: 'Profit disclosed',     points: 10, key: 'profit'     },
  { label: 'Contact info added',   points: 5,  key: 'phone'      },
  { label: 'Owner bio complete',   points: 10, key: 'bio'        },
  { label: '3+ highlights listed', points: 5,  key: 'highlights' },
]

export function TrustMeter({ score, size = 148, showBreakdown = false }: TrustMeterProps) {
  const meta = getTrustMeta(score)

  // Animate from 0 → score after mount
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(score), 80)
    return () => clearTimeout(t)
  }, [score])

  // ── SVG arc geometry ────────────────────────────────────────
  const strokeW = Math.round(size * 0.087)          // ~13px at 148
  const r       = (size - strokeW) / 2 - 2          // radius
  const cx      = size / 2
  const cy      = size / 2
  const circ    = 2 * Math.PI * r
  const SWEEP   = 0.75                              // 270° = 75% of 360°
  const trackLen   = circ * SWEEP
  const gap        = circ - trackLen
  const scoreFill  = (displayed / 100) * trackLen
  const ROTATE_DEG = 135                            // start at 7:30 o'clock

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Arc gauge */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Trust score ${score} out of 100 — ${meta.label}`}
        >
          {/* Shadow circle for depth */}
          <circle cx={cx} cy={cy} r={r + strokeW / 2 + 2} fill="none"
            stroke="rgba(0,0,0,0.2)" strokeWidth={1} />

          {/* Background track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={`${trackLen} ${gap}`}
            transform={`rotate(${ROTATE_DEG} ${cx} ${cy})`}
          />

          {/* Score arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={meta.color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={`${scoreFill} ${circ - scoreFill}`}
            transform={`rotate(${ROTATE_DEG} ${cx} ${cy})`}
            style={{
              transition: 'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)',
              filter:     `drop-shadow(0 0 8px ${meta.color}70)`,
            }}
          />

          {/* Glow dot at score tip */}
          {displayed > 2 && (
            <TipDot r={r} cx={cx} cy={cy} score={displayed} color={meta.color} rotateDeg={ROTATE_DEG} />
          )}

          {/* Centre text */}
          <text x={cx} y={cy - (size * 0.072)} textAnchor="middle"
            fontSize={size * 0.175} fontWeight="900"
            fill={meta.color} fontFamily="var(--font-poppins), sans-serif">
            {displayed}
          </text>
          <text x={cx} y={cy + (size * 0.06)} textAnchor="middle"
            fontSize={size * 0.073} fill="rgba(255,255,255,0.35)">
            / 100
          </text>
          <text x={cx} y={cy + (size * 0.175)} textAnchor="middle"
            fontSize={size * 0.073} fontWeight="700"
            fill={meta.color} letterSpacing="0.05em">
            {meta.label.toUpperCase()}
          </text>
        </svg>

        {/* Icon above gauge */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 text-xl select-none"
          aria-hidden="true"
        >
          {meta.icon}
        </div>
      </div>

      {/* Optional breakdown */}
      {showBreakdown && (
        <div className="w-full space-y-2 mt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-3 mb-3">
            Score breakdown
          </p>
          {BREAKDOWN_ITEMS.map((item) => {
            // Rough mapping from score to which items are achieved
            const cumulative =
              item.key === 'verified'    ? 40 :
              item.key === 'asking'      ? 55 :
              item.key === 'revenue'     ? 70 :
              item.key === 'profit'      ? 80 :
              item.key === 'phone'       ? 85 :
              item.key === 'bio'         ? 95 :
              100
            const achieved = score >= cumulative

            return (
              <div key={item.key} className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0"
                  style={
                    achieved
                      ? { background: 'rgba(16,185,129,0.2)', color: '#10B981' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }
                  }
                >
                  {achieved ? '✓' : '○'}
                </span>
                <span className={`text-xs flex-1 ${achieved ? 'text-fg-2' : 'text-fg-3'}`}>
                  {item.label}
                </span>
                <span className="text-[11px] font-semibold tabular-nums"
                  style={{ color: achieved ? '#10B981' : 'rgba(255,255,255,0.2)' }}>
                  +{item.points}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Glowing tip dot that moves with the arc ───────────────────────────────────

function TipDot({
  r, cx, cy, score, color, rotateDeg,
}: {
  r: number; cx: number; cy: number; score: number; color: string; rotateDeg: number
}) {
  const SWEEP_DEG = 270
  const angleDeg  = rotateDeg + (score / 100) * SWEEP_DEG
  const angleRad  = ((angleDeg - 90) * Math.PI) / 180   // convert to SVG convention
  const dotX      = cx + r * Math.cos(angleRad)
  const dotY      = cy + r * Math.sin(angleRad)

  return (
    <circle cx={dotX} cy={dotY} r={5} fill={color}
      style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
  )
}
