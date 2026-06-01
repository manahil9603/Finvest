'use client'

import { INDUSTRY_LABELS, PROVINCE_LABELS } from '@/lib/utils'
import { FUNDING_RANGES, REVENUE_RANGES, type FilterState } from './types'

// ─────────────────────────────────────────────────────────────
// Small reusable sub-components
// ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-fg-3 mb-2.5">{children}</p>
  )
}

function Divider() {
  return <div className="my-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
}

// pill checkbox
function PillCheck({
  label, checked, onChange, color,
}: { label: string; checked: boolean; onChange: () => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
      style={
        checked
          ? {
              background: color ? `${color}20` : 'rgba(139,92,246,0.18)',
              color:      color ?? '#A78BFA',
              border:     `1px solid ${color ?? 'rgba(139,92,246,0.45)'}`,
            }
          : {
              background: 'rgba(255,255,255,0.04)',
              color:      'rgba(255,255,255,0.45)',
              border:     '1px solid rgba(255,255,255,0.09)',
            }
      }
      aria-pressed={checked}
    >
      {checked && <span className="mr-1">✓</span>}
      {label}
    </button>
  )
}

// radio range row
function RangeRow({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-1.5 text-left text-xs transition-colors duration-150"
      style={{ color: active ? '#A78BFA' : 'rgba(255,255,255,0.45)' }}
      aria-pressed={active}
    >
      <span
        className="w-3.5 h-3.5 rounded-full shrink-0 border-2 flex items-center justify-center transition-all"
        style={
          active
            ? { borderColor: '#8B5CF6', background: '#8B5CF6' }
            : { borderColor: 'rgba(255,255,255,0.25)' }
        }
      >
        {active && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
      </span>
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Filter sidebar
// ─────────────────────────────────────────────────────────────

const LISTING_TYPES = [
  { value: '',            label: 'All'         },
  { value: 'INVESTMENT',  label: 'Investment'  },
  { value: 'ACQUISITION', label: 'Acquisition' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
]

const TYPE_COLORS: Record<string, string> = {
  INVESTMENT:  '#3B82F6',
  ACQUISITION: '#8B5CF6',
  PARTNERSHIP: '#F59E0B',
}

const STAGES = [
  { value: 'IDEA',      label: 'Idea',      color: '#71717A' },
  { value: 'STARTUP',   label: 'Startup',   color: '#0EA5E9' },
  { value: 'GROWING',   label: 'Growing',   color: '#10B981' },
  { value: 'EXPANDING', label: 'Expanding', color: '#8B5CF6' },
  { value: 'MATURE',    label: 'Mature',    color: '#F97316' },
]

interface Props {
  filters:   FilterState
  onChange:  (patch: Partial<FilterState>) => void
  onReset:   () => void
  activeCount: number
  onClose?:  () => void   // mobile close button
}

export function FilterSidebar({ filters, onChange, onReset, activeCount, onClose }: Props) {
  // ── Helper: find active funding range index ───────────────
  const activeFundIdx = FUNDING_RANGES.findIndex(
    (r) => r.min === filters.minAskingPrice && r.max === filters.maxAskingPrice
  )
  const activeRevIdx = REVENUE_RANGES.findIndex(
    (r) => r.min === filters.minRevenue && r.max === filters.maxRevenue
  )

  const setFunding = (idx: number) => {
    const r = FUNDING_RANGES[idx]
    onChange({ minAskingPrice: r.min, maxAskingPrice: r.max, page: 1 })
  }

  const setRevenue = (idx: number) => {
    const r = REVENUE_RANGES[idx]
    onChange({ minRevenue: r.min, maxRevenue: r.max, page: 1 })
  }

  const toggleStage = (val: string) => {
    const next = filters.stages.includes(val)
      ? filters.stages.filter((s) => s !== val)
      : [...filters.stages, val]
    onChange({ stages: next, page: 1 })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 sticky top-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'inherit' }}
      >
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          <span className="text-sm font-bold text-foreground">Filters</span>
          {activeCount > 0 && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-fg-3 hover:text-foreground hover:bg-surface/10 transition-colors lg:hidden"
              aria-label="Close filters"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-0 scrollbar-thin">

        {/* ── Opportunity Type ─────────────────────────────── */}
        <div>
          <SectionTitle>Opportunity Type</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {LISTING_TYPES.map((t) => (
              <PillCheck
                key={t.value}
                label={t.label}
                checked={filters.listingType === t.value}
                onChange={() => onChange({ listingType: t.value, page: 1 })}
                color={TYPE_COLORS[t.value]}
              />
            ))}
          </div>
        </div>

        <Divider />

        {/* ── Industry ─────────────────────────────────────── */}
        <div>
          <SectionTitle>Industry</SectionTitle>
          <div className="relative">
            <select
              value={filters.industry}
              onChange={(e) => onChange({ industry: e.target.value, page: 1 })}
              className="w-full text-xs rounded-xl px-3.5 py-2.5 appearance-none cursor-pointer pr-8"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border:     '1px solid rgba(255,255,255,0.1)',
                color:      filters.industry ? 'rgb(var(--fg))' : 'rgba(255,255,255,0.4)',
              }}
            >
              <option value="">All Industries</option>
              {Object.entries(INDUSTRY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-fg-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>

        <Divider />

        {/* ── Province ─────────────────────────────────────── */}
        <div>
          <SectionTitle>Province / Location</SectionTitle>
          <div className="relative">
            <select
              value={filters.province}
              onChange={(e) => onChange({ province: e.target.value, page: 1 })}
              className="w-full text-xs rounded-xl px-3.5 py-2.5 appearance-none cursor-pointer pr-8"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border:     '1px solid rgba(255,255,255,0.1)',
                color:      filters.province ? 'rgb(var(--fg))' : 'rgba(255,255,255,0.4)',
              }}
            >
              <option value="">All Provinces</option>
              {Object.entries(PROVINCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-fg-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>

        <Divider />

        {/* ── Business Stage ───────────────────────────────── */}
        <div>
          <SectionTitle>Business Stage</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <PillCheck
                key={s.value}
                label={s.label}
                checked={filters.stages.includes(s.value)}
                onChange={() => toggleStage(s.value)}
                color={s.color}
              />
            ))}
          </div>
        </div>

        <Divider />

        {/* ── Funding Required ─────────────────────────────── */}
        <div>
          <SectionTitle>Funding Required</SectionTitle>
          <div className="space-y-0.5">
            {FUNDING_RANGES.map((r, i) => (
              <RangeRow
                key={r.label}
                label={r.label}
                active={activeFundIdx === i || (i === 0 && activeFundIdx === -1)}
                onClick={() => setFunding(i)}
              />
            ))}
          </div>
        </div>

        <Divider />

        {/* ── Annual Revenue ───────────────────────────────── */}
        <div>
          <SectionTitle>Annual Revenue</SectionTitle>
          <div className="space-y-0.5">
            {REVENUE_RANGES.map((r, i) => (
              <RangeRow
                key={r.label}
                label={r.label}
                active={activeRevIdx === i || (i === 0 && activeRevIdx === -1)}
                onClick={() => setRevenue(i)}
              />
            ))}
          </div>
        </div>

        <Divider />

        {/* ── Verified only ─────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">Verified owners only</p>
            <p className="text-[11px] text-fg-3 mt-0.5">Show listings with ✅ verified profiles</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={filters.verifiedOnly}
            onClick={() => onChange({ verifiedOnly: !filters.verifiedOnly, page: 1 })}
            className="relative w-10 h-5.5 rounded-full transition-all duration-200 shrink-0"
            style={{
              width: '40px', height: '22px',
              background: filters.verifiedOnly ? '#10B981' : 'rgba(255,255,255,0.12)',
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all duration-200"
              style={{
                width: '18px', height: '18px',
                transform: filters.verifiedOnly ? 'translateX(18px)' : 'translateX(0)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            />
          </button>
        </div>

        <Divider />

        {/* ── Trust Score Minimum ───────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Min. Trust Score</SectionTitle>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}
            >
              {filters.minTrustScore}+
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={filters.minTrustScore}
            onChange={(e) => onChange({ minTrustScore: Number(e.target.value), page: 1 })}
            className="trust-score-slider"
            aria-label="Minimum trust score"
            style={{
              '--slider-value': `${filters.minTrustScore}%`,
            } as React.CSSProperties}
          />

          <div className="flex justify-between text-[10px] text-fg-3 mt-1.5">
            <span>Any</span>
            <span>High trust only (80+)</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2 mt-3">
            {[0, 40, 60, 80].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ minTrustScore: v, page: 1 })}
                className="flex-1 text-[11px] py-1 rounded-lg font-medium transition-all"
                style={
                  filters.minTrustScore === v
                    ? { background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.35)' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {v === 0 ? 'Any' : `${v}+`}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom padding for mobile */}
        <div className="h-4" />
      </div>
    </div>
  )
}
