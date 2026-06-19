'use client'

import { useState, useCallback } from 'react'
import { INDUSTRY_LABELS } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export interface ExpertProfileData {
  id?:                 string
  yearsExperience:     number | null
  skills:              string[]
  preferredIndustries: string[]
  expertSummary:       string | null
  available:           boolean
}

interface Props {
  initial: ExpertProfileData | null
  onSaved: (profile: ExpertProfileData) => void
}

const INDUSTRY_COLORS: Record<string, string> = {
  TECHNOLOGY: '#38BDF8', RETAIL: '#F472B6', MANUFACTURING: '#34D399',
  FOOD_BEVERAGE: '#FB923C', REAL_ESTATE: '#60A5FA', HEALTHCARE: '#2DD4BF',
  EDUCATION: '#818CF8', AGRICULTURE: '#A3E635', TEXTILE: '#F9A8D4',
  LOGISTICS: '#67E8F9', HOSPITALITY: '#FCD34D', FINANCE: '#6EE7B7',
  CONSTRUCTION: '#FCA5A5', MEDIA: '#C4B5FD', OTHER: '#9CA3AF',
}

export function ExpertProfileForm({ initial, onSaved }: Props) {
  const { success, error: showError } = useToast()

  const [yearsRaw, setYearsRaw] = useState(initial?.yearsExperience != null ? String(initial.yearsExperience) : '')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? [])
  const [industries, setIndustries] = useState<string[]>(initial?.preferredIndustries ?? [])
  const [summary, setSummary] = useState(initial?.expertSummary ?? '')
  const [available, setAvailable] = useState(initial?.available ?? true)
  const [loading, setLoading] = useState(false)

  const toggleIndustry = useCallback((ind: string) => {
    setIndustries((prev) => prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind])
  }, [])

  const addSkill = () => {
    const t = skillInput.trim()
    if (!t || skills.length >= 12 || skills.includes(t)) return
    setSkills((prev) => [...prev, t])
    setSkillInput('')
  }

  const handleSave = async () => {
    const years = yearsRaw ? Number(yearsRaw) : null
    if (!years || years < 1) {
      showError('Invalid experience', 'Enter at least 1 year of business experience.')
      return
    }
    if (skills.length === 0) {
      showError('Skills required', 'Add at least one business skill.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/expert-profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          yearsExperience: years,
          skills,
          preferredIndustries: industries,
          expertSummary: summary.trim() || null,
          available,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showError('Save failed', data.error ?? 'Could not save profile.')
        return
      }
      onSaved(data.data)
      success('Profile saved', 'Owners can now see your expertise.')
    } catch {
      showError('Network error', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl p-6 sm:p-8"
         style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h2 className="font-display font-bold text-lg text-foreground mb-1">Expert profile</h2>
      <p className="text-sm text-fg-3 mb-6">Show owners you have the skills to run their business as CEO or operator.</p>

      <div className="space-y-5">
        <div>
          <label className="label">Years of business experience *</label>
          <input type="number" className="input" min={1} max={50} placeholder="8"
                 value={yearsRaw} onChange={(e) => setYearsRaw(e.target.value)} />
        </div>

        <div>
          <label className="label">Business skills *</label>
          <div className="flex gap-2 mb-2">
            <input className="input flex-1" placeholder="Operations, P&amp;L, team building…"
                   value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} />
            <button type="button" onClick={addSkill}
                    className="px-4 rounded-xl text-sm font-semibold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}>
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(139,92,246,0.15)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.3)' }}>
                {s}
                <button type="button" onClick={() => setSkills((prev) => prev.filter((_, idx) => idx !== i))}
                        className="opacity-60 hover:opacity-100" aria-label={`Remove ${s}`}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Industries you can operate in</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
              <button key={key} type="button" onClick={() => toggleIndustry(key)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={
                        industries.includes(key)
                          ? { background: `${INDUSTRY_COLORS[key] ?? '#8B5CF6'}22`, color: INDUSTRY_COLORS[key] ?? '#A78BFA', border: `1px solid ${INDUSTRY_COLORS[key] ?? '#8B5CF6'}55` }
                          : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.09)' }
                      }
                      aria-pressed={industries.includes(key)}>
                {industries.includes(key) && <span className="mr-1">✓</span>}{label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Professional summary</label>
          <textarea className="input min-h-[100px] resize-y" placeholder="Businesses you have run, turnaround experience, leadership style…"
                    value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={1000} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)}
                 className="mt-1 rounded" />
          <span>
            <span className="block text-sm font-semibold text-foreground">Available for operator / CEO roles</span>
            <span className="block text-xs text-fg-3">Show that you are open to running someone else&apos;s business.</span>
          </span>
        </label>

        <button type="button" onClick={handleSave} disabled={loading}
                className="w-full py-3 rounded-2xl font-semibold text-sm text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}>
          {loading ? 'Saving…' : 'Save expert profile'}
        </button>
      </div>
    </div>
  )
}
