'use client'

import { useEffect, useRef } from 'react'

export interface ChartDay {
  label: string   // "Mon"
  date:  string   // "2024-01-15"
  count: number
}

interface AnalyticsChartProps {
  data:  ChartDay[]
  total: number
}

export function AnalyticsChart({ data, total }: AnalyticsChartProps) {
  const canvasRef = useRef<SVGSVGElement>(null)
  const max       = Math.max(...data.map((d) => d.count), 1)

  const W = 560
  const H = 140
  const PADDING = { top: 16, bottom: 28, left: 8, right: 8 }
  const barAreaH = H - PADDING.top - PADDING.bottom
  const colW     = (W - PADDING.left - PADDING.right) / data.length
  const barW     = colW * 0.52

  // trend vs previous period
  const thisHalf = data.slice(4).reduce((s, d) => s + d.count, 0)
  const prevHalf = data.slice(0, 3).reduce((s, d) => s + d.count, 0)
  const trend    = prevHalf === 0 ? null : ((thisHalf - prevHalf) / prevHalf) * 100

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3">Connection Requests</p>
          <p className="font-display font-black text-3xl text-foreground mt-0.5">{total}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-fg-3">Last 7 days</p>
          {trend !== null && (
            <p className="text-sm font-semibold mt-0.5"
               style={{ color: trend >= 0 ? '#34D399' : '#F87171' }}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(0)}% vs prev
            </p>
          )}
        </div>
      </div>

      {/* SVG bar chart */}
      <div className="w-full overflow-hidden">
        <svg
          ref={canvasRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          aria-label={`Bar chart of connection requests over the last 7 days. Total: ${total}`}
          role="img"
        >
          <defs>
            <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#6B21A8" />
            </linearGradient>
            <linearGradient id="bar-grad-zero" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(139,92,246,0.15)" />
              <stop offset="100%" stopColor="rgba(107,33,168,0.08)" />
            </linearGradient>
          </defs>

          {/* Baseline */}
          <line
            x1={PADDING.left} y1={H - PADDING.bottom}
            x2={W - PADDING.right} y2={H - PADDING.bottom}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1}
          />

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const y = PADDING.top + barAreaH * (1 - frac)
            return (
              <line key={frac}
                x1={PADDING.left} y1={y}
                x2={W - PADDING.right} y2={y}
                stroke="rgba(255,255,255,0.04)" strokeWidth={1}
              />
            )
          })}

          {/* Bars + labels */}
          {data.map((day, i) => {
            const x      = PADDING.left + i * colW + (colW - barW) / 2
            const pct    = day.count / max
            const barH   = day.count === 0 ? 3 : Math.max(4, barAreaH * pct)
            const y      = PADDING.top + barAreaH - barH
            const isZero = day.count === 0

            return (
              <g key={day.date}>
                {/* Bar */}
                <rect
                  x={x} y={y} width={barW} height={barH}
                  rx={4} ry={4}
                  fill={isZero ? 'url(#bar-grad-zero)' : 'url(#bar-grad)'}
                  opacity={isZero ? 0.5 : 1}
                  style={{
                    transformOrigin: `${x + barW / 2}px ${H - PADDING.bottom}px`,
                    animation: `scaleBarUp 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms both`,
                  }}
                />

                {/* Count label above bar */}
                {day.count > 0 && (
                  <text
                    x={x + barW / 2} y={y - 4}
                    textAnchor="middle" fontSize={9} fontWeight="700"
                    fill="rgba(139,92,246,0.9)"
                  >
                    {day.count}
                  </text>
                )}

                {/* Day label */}
                <text
                  x={x + barW / 2} y={H - 6}
                  textAnchor="middle" fontSize={10} fontWeight="500"
                  fill="rgba(255,255,255,0.35)"
                >
                  {day.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <style>{`
        @keyframes scaleBarUp {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}
