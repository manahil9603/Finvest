'use client'

import { useEffect, useRef } from 'react'

export interface ChartSeries {
  labels:        string[]
  userGrowth:    number[]
  listingTrends: number[]
  connMetrics:   number[]
}

// ─────────────────────────────────────────────────────────────
// Generic SVG line / area chart
// ─────────────────────────────────────────────────────────────

interface MiniChartProps {
  data:    number[]
  labels:  string[]
  color:   string
  fill?:   boolean
  label:   string
  total:   number
  change?: number  // week-over-week delta (last vs second-last)
}

function MiniChart({ data, labels, color, fill = false, label, total, change }: MiniChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const W   = 320
  const H   = 80
  const PAD = { top: 10, right: 10, bottom: 24, left: 4 }
  const max = Math.max(...data, 1)

  const points = data.map((v, i) => {
    const x = PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right)
    const y = PAD.top  + (1 - v / max)           * (H - PAD.top - PAD.bottom)
    return { x, y }
  })

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  const area =
    `M ${points[0].x},${H - PAD.bottom} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x},${H - PAD.bottom} Z`

  const isPositive = (change ?? 0) >= 0

  return (
    <div
      className="rounded-3xl p-5 flex flex-col"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-3 mb-1">{label}</p>
          <p className="font-display font-black text-2xl" style={{ color }}>{total.toLocaleString()}</p>
        </div>
        {change !== undefined && (
          <div
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color:      isPositive ? '#34D399' : '#F87171',
            }}
          >
            {isPositive ? '▲' : '▼'} {Math.abs(change)}
          </div>
        )}
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        aria-label={`${label} chart showing ${total} total`}
        role="img"
      >
        <defs>
          <linearGradient id={`fill-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Base grid line */}
        <line
          x1={PAD.left} y1={H - PAD.bottom}
          x2={W - PAD.right} y2={H - PAD.bottom}
          stroke="rgba(255,255,255,0.07)" strokeWidth={1}
        />

        {/* Area fill */}
        {fill && (
          <path
            d={area}
            fill={`url(#fill-${label.replace(/\s+/g, '')})`}
          />
        )}

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: `${W * 2}`,
            strokeDashoffset: `${W * 2}`,
            animation: `drawLine 1.2s ease-out forwards`,
          }}
        />

        {/* Data dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={color}
            style={{ opacity: 0, animation: `fadeIn 0.3s ease-out ${0.9 + i * 0.05}s forwards` }} />
        ))}

        {/* X-axis labels (every 2nd) */}
        {labels.map((lbl, i) => {
          if (i % 2 !== 0) return null
          return (
            <text key={lbl} x={points[i].x} y={H - 4}
              textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.25)">
              {lbl}
            </text>
          )
        })}
      </svg>

      <style>{`
        @keyframes drawLine { to { stroke-dashoffset: 0; } }
        @keyframes fadeIn   { to { opacity: 1; } }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Bar chart (for listing trends)
// ─────────────────────────────────────────────────────────────

function BarChart({ data, labels, color, label, total, change }: MiniChartProps) {
  const W       = 320
  const H       = 80
  const PAD     = { top: 10, right: 8, bottom: 24, left: 4 }
  const max     = Math.max(...data, 1)
  const barAreaW = W - PAD.left - PAD.right
  const barAreaH = H - PAD.top - PAD.bottom
  const colW    = barAreaW / data.length
  const barW    = colW * 0.6
  const isPositive = (change ?? 0) >= 0

  return (
    <div
      className="rounded-3xl p-5 flex flex-col"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-3 mb-1">{label}</p>
          <p className="font-display font-black text-2xl" style={{ color }}>{total.toLocaleString()}</p>
        </div>
        {change !== undefined && (
          <div className="text-xs font-bold px-2.5 py-1 rounded-full"
               style={{ background: isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isPositive ? '#34D399' : '#F87171' }}>
            {isPositive ? '▲' : '▼'} {Math.abs(change)}
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
           aria-label={`${label} bar chart, total: ${total}`} role="img">
        <defs>
          <linearGradient id={`bar-${label.replace(/\s+/g,'')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom}
              stroke="rgba(255,255,255,0.07)" strokeWidth={1} />

        {data.map((v, i) => {
          const barH  = v === 0 ? 2 : Math.max(3, (v / max) * barAreaH)
          const x     = PAD.left + i * colW + (colW - barW) / 2
          const y     = PAD.top + barAreaH - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={3}
                fill={`url(#bar-${label.replace(/\s+/g,'')})`}
                opacity={v === 0 ? 0.3 : 1}
                style={{ transformOrigin: `${x + barW/2}px ${H - PAD.bottom}px`,
                         animation: `scaleBarUp 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms both` }} />
              {i % 2 === 0 && (
                <text x={x + barW/2} y={H - 4} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.25)">
                  {labels[i]}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <style>{`@keyframes scaleBarUp { from { transform: scaleY(0); } to { transform: scaleY(1); } }`}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Exported charts row
// ─────────────────────────────────────────────────────────────

interface AdminChartsProps {
  series: ChartSeries
  totals: { users: number; businesses: number; connections: number }
}

export function AdminCharts({ series, totals }: AdminChartsProps) {
  const n    = series.userGrowth.length
  const uDelta = n >= 2 ? (series.userGrowth[n-1] ?? 0)    - (series.userGrowth[n-2] ?? 0)    : 0
  const bDelta = n >= 2 ? (series.listingTrends[n-1] ?? 0) - (series.listingTrends[n-2] ?? 0) : 0
  const cDelta = n >= 2 ? (series.connMetrics[n-1] ?? 0)   - (series.connMetrics[n-2] ?? 0)   : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MiniChart
        data={series.userGrowth}
        labels={series.labels}
        color="#A78BFA"
        fill
        label="User Growth"
        total={totals.users}
        change={uDelta}
      />
      <BarChart
        data={series.listingTrends}
        labels={series.labels}
        color="#34D399"
        label="New Listings"
        total={totals.businesses}
        change={bDelta}
      />
      <MiniChart
        data={series.connMetrics}
        labels={series.labels}
        color="#60A5FA"
        fill
        label="Connection Requests"
        total={totals.connections}
        change={cDelta}
      />
    </div>
  )
}
