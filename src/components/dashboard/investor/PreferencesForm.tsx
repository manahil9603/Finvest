'use client'

import { useState, useCallback } from 'react'
import { INDUSTRY_LABELS, PROVINCE_LABELS } from '@/lib/utils'
import { formatPKR } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface InvestorProfileData {
  id?:                 string
  minInvestment:       number | null
  maxInvestment:       number | null
  preferredIndustries: string[]
  preferredProvinces:  string[]
  investmentThesis:    string | null
  portfolioSize:       number | null
  accredited:          boolean
}

interface Props {
  initial:   InvestorProfileData | null
  onSaved:   (profile: InvestorProfileData) => void
  onRefresh: (profile: InvestorProfileData) => void
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function PillToggle({
  label, active, onClick, color,
}: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
      style={
        active
          ? { background: color ? `${color}22` : 'rgba(139,92,246,0.18)', color: color ?? '#A78BFA', border: `1px solid ${color ?? 'rgba(139,92,246,0.45)'}` }
          : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.09)' }
      }
      aria-pressed={active}
    >
      {active && <span className="mr-1 text-[10px]">✓</span>}
      {label}
    </button>
  )
}

const INDUSTRY_COLORS: Record<string, string> = {
  TECHNOLOGY: '#38BDF8', RETAIL: '#F472B6', MANUFACTURING: '#34D399',
  FOOD_BEVERAGE: '#FB923C', REAL_ESTATE: '#60A5FA', HEALTHCARE: '#2DD4BF',
  EDUCATION: '#818CF8', AGRICULTURE: '#A3E635', TEXTILE: '#F9A8D4',
  LOGISTICS: '#67E8F9', HOSPITALITY: '#FCD34D', FINANCE: '#6EE7B7',
  CONSTRUCTION: '#FCA5A5', MEDIA: '#C4B5FD', OTHER: '#9CA3AF',
}

const TICKET_PRESETS = [
  { label: 'Under 5 Lac',   min: 0,          max: 500_000 },
  { label: '5–25 Lac',      min: 500_001,     max: 2_500_000 },
  { label: '25 Lac–1 Cr',   min: 2_500_001,   max: 10_000_000 },
  { label: '1–5 Crore',     min: 10_000_001,  max: 50_000_000 },
  { label: '5–20 Crore',    min: 50_000_001,  max: 200_000_000 },
  { label: '20 Crore+',     min: 200_000_001, max: 0 },
]

// ─────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────

export function PreferencesForm({ initial, onSaved, onRefresh }: Props) {
  const { success, error: showError } = useToast()

  const [minRaw,  setMinRaw]  = useState(initial?.minInvestment != null ? String(initial.minInvestment) : '')
  const [maxRaw,  setMaxRaw]  = useState(initial?.maxInvestment != null ? String(initial.maxInvestment) : '')
  const [industries, setIndustries] = useState<string[]>(initial?.preferredIndustries ?? [])
  const [provinces,  setProvinces]  = useState<string[]>(initial?.preferredProvinces  ?? [])
  const [thesis,     setThesis]     = useState(initial?.investmentThesis ?? '')
  const [portfolio,  setPortfolio]  = useState(initial?.portfolioSize != null ? String(initial.portfolioSize) : '')
  const [accredited, setAccredited] = useState(initial?.accredited ?? false)
  const [loading,    setLoading]    = useState(false)
  const [dirty,      setDirty]      = useState(false)

  const markDirty = () => setDirty(true)

  const toggleIndustry = useCallback((ind: string) => {
    setIndustries((prev) => prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind])
    markDirty()
  }, [])

  const toggleProvince = useCallback((prov: string) => {
    setProvinces((prev) => prev.includes(prov) ? prev.filter((p) => p !== prov) : [...prev, prov])
    markDirty()
  }, [])

  const applyPreset = (preset: typeof TICKET_PRESETS[0]) => {
    setMinRaw(preset.min  > 0 ? String(preset.min)  : '')
    setMaxRaw(preset.max  > 0 ? String(preset.max)  : '')
    markDirty()
  }

  const minVal = minRaw ? Number(minRaw) : null
  const maxVal = maxRaw ? Number(maxRaw) : null

  const handleSave = async () => {
    if (minVal && maxVal && minVal > maxVal) {
      showError('Invalid range', 'Minimum investment cannot exceed the maximum.')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/investor-profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          minInvestment:       minVal,
          maxInvestment:       maxVal,
          preferredIndustries: industries,
          preferredProvinces:  provinces,
          investmentThesis:    thesis || null,
          portfolioSize:       portfolio ? Number(portfolio) : null,
          accredited,
        }),
      })
      const data = await res.json()
      if (!res.ok) { showError('Failed', data.error); return }
      setDirty(false)
      success('Preferences saved!', 'Your recommendations will now update.')
      onSaved(data.data)
      onRefresh(data.data)
    } catch {
      showError('Network error', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const ticketDisplay =
    minVal && maxVal ? `${formatPKR(minVal)} – ${formatPKR(maxVal)}`
    : minVal         ? `${formatPKR(minVal)}+`
    : maxVal         ? `Up to ${formatPKR(maxVal)}`
    : 'Not specified'

  const glassSection: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border:     '1px solid rgba(255,255,255,0.08)',
    borderRadius: '1.25rem',
    padding: '1.25rem',
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Ticket size ─────────────────────────────────── */}
      <div style={glassSection}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-fg-3 mb-3">Investment Ticket Size</p>

        {/* Display */}
        <div className="mb-3 font-display font-black text-lg"
             style={{ backgroundImage: 'linear-gradient(135deg,#A78BFA,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {ticketDisplay}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {TICKET_PRESETS.map((p) => {
            const active = p.min === (minVal ?? 0) && p.max === (maxVal ?? 0)
            return (
              <button key={p.label} type="button" onClick={() => applyPreset(p)}
                className="text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all"
                style={active
                  ? { background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.4)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
                }>
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Manual inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Min (PKR)</label>
            <input type="number" className="input text-sm" placeholder="e.g. 5000000" min="0"
              value={minRaw} onChange={(e) => { setMinRaw(e.target.value); markDirty() }} />
          </div>
          <div>
            <label className="label">Max (PKR)</label>
            <input type="number" className="input text-sm" placeholder="e.g. 50000000" min="0"
              value={maxRaw} onChange={(e) => { setMaxRaw(e.target.value); markDirty() }} />
          </div>
        </div>
      </div>

      {/* ── Preferred Industries ─────────────────────────── */}
      <div style={glassSection}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-3">Preferred Industries</p>
          {industries.length > 0 && (
            <button type="button" onClick={() => { setIndustries([]); markDirty() }}
              className="text-[11px] text-red-400/70 hover:text-red-400 transition-colors">
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
            <PillToggle
              key={key}
              label={label}
              active={industries.includes(key)}
              onClick={() => toggleIndustry(key)}
              color={INDUSTRY_COLORS[key]}
            />
          ))}
        </div>
        {industries.length === 0 && (
          <p className="text-xs text-fg-3 mt-2">No preference — all industries shown</p>
        )}
      </div>

      {/* ── Preferred Provinces ──────────────────────────── */}
      <div style={glassSection}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-3">Preferred Provinces</p>
          {provinces.length > 0 && (
            <button type="button" onClick={() => { setProvinces([]); markDirty() }}
              className="text-[11px] text-red-400/70 hover:text-red-400 transition-colors">
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(PROVINCE_LABELS).map(([key, label]) => (
            <PillToggle key={key} label={label} active={provinces.includes(key)} onClick={() => toggleProvince(key)} />
          ))}
        </div>
        {provinces.length === 0 && (
          <p className="text-xs text-fg-3 mt-2">No preference — all provinces shown</p>
        )}
      </div>

      {/* ── Investment Thesis ────────────────────────────── */}
      <div style={glassSection}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-fg-3 mb-3">Investment Thesis</p>
        <textarea
          className="input text-sm resize-none h-24"
          placeholder="Describe your investment thesis, criteria, and what you look for in a business…"
          value={thesis}
          onChange={(e) => { setThesis(e.target.value); markDirty() }}
          maxLength={1000}
        />
        <p className="text-[11px] mt-1 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {thesis.length}/1000
        </p>
      </div>

      {/* ── Portfolio + Accredited ───────────────────────── */}
      <div style={glassSection}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-fg-3 mb-3">Profile Details</p>
        <div className="space-y-4">
          <div>
            <label className="label">Portfolio Size (no. of investments)</label>
            <input type="number" className="input text-sm" placeholder="e.g. 5" min="0"
              value={portfolio} onChange={(e) => { setPortfolio(e.target.value); markDirty() }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">SECP Accredited Investor</p>
              <p className="text-xs text-fg-3 mt-0.5">Confirms you meet accreditation criteria</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={accredited}
              onClick={() => { setAccredited(!accredited); markDirty() }}
              className="relative shrink-0 rounded-full transition-all duration-200"
              style={{ width: 40, height: 22, background: accredited ? '#10B981' : 'rgba(255,255,255,0.12)' }}
            >
              <span className="absolute top-0.5 left-0.5 rounded-full bg-white transition-all duration-200"
                    style={{ width: 18, height: 18, transform: accredited ? 'translateX(18px)' : 'translateX(0)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Save button ──────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSave}
        disabled={loading || !dirty}
        className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-40 hover:-translate-y-0.5 disabled:translate-y-0"
        style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', boxShadow: dirty ? '0 4px 15px rgba(107,33,168,0.4)' : 'none' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Saving…
          </span>
        ) : dirty ? '💾 Save Preferences' : '✓ Preferences Saved'}
      </button>
    </div>
  )
}
