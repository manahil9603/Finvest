'use client'

import { useState, useRef, useCallback, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { INDUSTRY_LABELS, PROVINCE_LABELS } from '@/lib/utils'
import { CITIES_BY_PROVINCE } from '@/lib/constants'
import { useToast } from '@/hooks/useToast'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface BusinessFormData {
  title:       string
  description: string
  industry:    string
  city:        string
  province:    string
  listingType: string
  stage:       string
  askingPrice: string
  revenue:     string
  profit:      string
  employees:   string
  established: string
  highlights:  string[]
  imageUrls:   string[]
  status:      'DRAFT' | 'ACTIVE'
}

export interface BusinessDraft {
  id:          string
  title:       string
  description: string
  industry:    string
  city:        string
  province:    string
  listingType: string
  stage:       string
  askingPrice: number | null
  revenue:     number | null
  profit:      number | null
  employees:   number | null
  established: number | null
  highlights:  string[]
  imageUrls:   string[]
  status:      string
  featured:    boolean
  createdAt:   string
  /** Present on server-loaded rows (trust score); optional after client-only edits */
  owner?: {
    verified: boolean
    phone: string | null
    bio: string | null
  }
}

interface Props {
  open:     boolean
  onClose:  () => void
  onSaved:  (business: BusinessDraft, isNew: boolean) => void
  editing?: BusinessDraft | null
}

const STAGES = [
  { value: 'IDEA',      label: 'Idea — concept stage' },
  { value: 'STARTUP',   label: 'Startup — early operation' },
  { value: 'GROWING',   label: 'Growing — scaling revenue' },
  { value: 'EXPANDING', label: 'Expanding — entering new markets' },
  { value: 'MATURE',    label: 'Mature — established & stable' },
]

function empty(): BusinessFormData {
  return {
    title: '', description: '', industry: '', city: '', province: '',
    listingType: 'INVESTMENT', stage: 'GROWING',
    askingPrice: '', revenue: '', profit: '', employees: '', established: '',
    highlights: [], imageUrls: [], status: 'DRAFT',
  }
}

function fromDraft(d: BusinessDraft): BusinessFormData {
  return {
    title:       d.title,
    description: d.description,
    industry:    d.industry,
    city:        d.city,
    province:    d.province,
    listingType: d.listingType,
    stage:       d.stage,
    askingPrice: d.askingPrice != null ? String(d.askingPrice) : '',
    revenue:     d.revenue     != null ? String(d.revenue)     : '',
    profit:      d.profit      != null ? String(d.profit)      : '',
    employees:   d.employees   != null ? String(d.employees)   : '',
    established: d.established != null ? String(d.established) : '',
    highlights:  d.highlights,
    imageUrls:   d.imageUrls,
    status:      (d.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT') as 'DRAFT' | 'ACTIVE',
  }
}

function intentFromListingType(type: string) {
  return {
    isForSale: type === 'ACQUISITION' || type === 'PARTNERSHIP',
    isSeekingInvestment: type === 'INVESTMENT' || type === 'PARTNERSHIP',
  }
}

function listingTypeFromIntent(isForSale: boolean, isSeekingInvestment: boolean) {
  if (isForSale && isSeekingInvestment) return 'PARTNERSHIP'
  if (isForSale) return 'ACQUISITION'
  if (isSeekingInvestment) return 'INVESTMENT'
  return ''
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
       style={{ color: 'rgba(255,255,255,0.3)' }}>
      {children}
    </p>
  )
}

function Field({ label, error, children, hint }: {
  label: string; error?: string; children: React.ReactNode; hint?: string
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{hint}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────

export function BusinessFormPanel({ open, onClose, onSaved, editing }: Props) {
  const { success, error: showError } = useToast()
  const [form, setForm]     = useState<BusinessFormData>(() => editing ? fromDraft(editing) : empty())
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [imagePreviews, setImagePreviews] = useState<string[]>(() => editing?.imageUrls ?? [])
  const fileRef = useRef<HTMLInputElement>(null)

  // Reset form when editing target changes
  const prevEditing = useRef(editing?.id)
  if (editing?.id !== prevEditing.current) {
    prevEditing.current = editing?.id
    setForm(editing ? fromDraft(editing) : empty())
    setErrors({})
    setTagInput('')
    setImagePreviews(editing?.imageUrls ?? [])
  }

  const set = useCallback((field: keyof BusinessFormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  // ── Tag / highlight input ──────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim()
    if (!t || form.highlights.length >= 6 || form.highlights.includes(t)) return
    set('highlights', [...form.highlights, t])
    setTagInput('')
  }

  const removeTag = (i: number) =>
    set('highlights', form.highlights.filter((_, idx) => idx !== i))

  // ── Image selection ──
  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const remaining = Math.max(0, 5 - form.imageUrls.length)
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
      .slice(0, remaining)

    if (valid.length === 0) return

    try {
      const imageUrls = await Promise.all(valid.map(readImageAsDataUrl))
      setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...imageUrls].slice(0, 5) }))
      setImagePreviews((prev) => [...prev, ...imageUrls].slice(0, 5))
      setErrors((prev) => ({ ...prev, imageUrls: undefined }))
    } catch {
      showError('Upload failed', 'One or more images could not be read.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== index))
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, idx) => idx !== index),
    }))
  }

  const setOpportunityIntent = (field: 'isForSale' | 'isSeekingInvestment', value: boolean) => {
    const current = intentFromListingType(form.listingType)
    const next = { ...current, [field]: value }
    set('listingType', listingTypeFromIntent(next.isForSale, next.isSeekingInvestment))
  }

  // ── Validation ─────────────────────────────────────────────
  function validate(): boolean {
    const e: Partial<Record<keyof BusinessFormData, string>> = {}
    if (!form.title.trim()       || form.title.trim().length < 5)  e.title = 'Title must be at least 5 characters.'
    if (!form.description.trim() || form.description.trim().length < 20) e.description = 'Description must be at least 20 characters.'
    if (!form.industry)          e.industry    = 'Please select an industry.'
    if (!form.city.trim())       e.city        = 'City is required.'
    if (!form.province)          e.province    = 'Please select a province.'
    if (!form.stage)             e.stage       = 'Please select a business stage.'
    if (!form.listingType)       e.listingType = 'Choose at least one opportunity type.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (status: 'DRAFT' | 'ACTIVE', submitForReview = false) => {
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        ...form,
        status,
        askingPrice: form.askingPrice ? Number(form.askingPrice) : null,
        revenue:     form.revenue     ? Number(form.revenue)     : null,
        profit:      form.profit      ? Number(form.profit)      : null,
        employees:   form.employees   ? Number(form.employees)   : null,
        established: form.established ? Number(form.established) : null,
        imageUrls:   form.imageUrls,
      }

      const isNew = !editing
      const url   = editing ? `/api/businesses/${editing.id}` : '/api/businesses'
      const method= editing ? 'PUT' : 'POST'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.field) setErrors({ [data.field]: data.error })
        else showError('Failed', data.error ?? 'Something went wrong.')
        return
      }

      success(
        isNew ? 'Business created!' : 'Business updated!',
        submitForReview ? 'Submitted for admin review.' : 'Saved as draft.'
      )
      onSaved(data.data, isNew)
      onClose()
    } catch {
      showError('Network error', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cities = form.province ? (CITIES_BY_PROVINCE as Record<string, string[]>)[
    Object.keys(CITIES_BY_PROVINCE).find((k) =>
      k.toUpperCase().replace(/ /g,'_').replace(/-/g,'_') === form.province ||
      k.toUpperCase() === form.province
    ) ?? ''
  ] ?? [] : []

  // Inline style constants
  const glassPanel: React.CSSProperties = {
    background: 'rgba(14,14,18,0.98)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    borderLeft: '1px solid rgba(255,255,255,0.09)',
  }
  const opportunityIntent = intentFromListingType(form.listingType)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl flex flex-col"
            style={glassPanel}
            role="dialog"
            aria-modal="true"
            aria-label={editing ? 'Edit business listing' : 'Create new business listing'}
          >
            {/* Gradient accent */}
            <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,#6B21A8,#8B5CF6,#10B981)' }} />

            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 shrink-0"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  {editing ? 'Edit Business' : 'List Your Business'}
                </h2>
                <p className="text-xs text-fg-3 mt-0.5">
                  {editing ? `Editing: ${editing.title}` : 'Fill in the details to list your business on Finvest'}
                </p>
              </div>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-fg-3 hover:text-foreground hover:bg-surface/10 transition-colors" aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-8 scrollbar-thin">

              {/* ── Basic Information ─────────────────────────── */}
              <section>
                <SectionLabel>1. Basic Information</SectionLabel>
                <div className="space-y-4">
                  <Field label="Business Name *" error={errors.title}>
                    <input
                      className={`input${errors.title ? ' input-error' : ''}`}
                      placeholder="e.g. Karachi Textile Export Co."
                      value={form.title}
                      onChange={(e) => set('title', e.target.value)}
                      maxLength={160}
                    />
                  </Field>
                  <Field label="Description *" error={errors.description} hint="Min 20 characters. Describe your business, what makes it unique, and what you're looking for.">
                    <textarea
                      className={`input resize-none h-36${errors.description ? ' input-error' : ''}`}
                      placeholder="Describe your business model, revenue streams, key achievements, and what you're seeking from investors or buyers."
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                    />
                    <p className="text-[11px] mt-1 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {form.description.length} chars
                    </p>
                  </Field>
                  <Field label="Industry *" error={errors.industry}>
                    <select className={`input appearance-none${errors.industry ? ' input-error' : ''}`}
                      value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                      <option value="">Select industry…</option>
                      {Object.entries(INDUSTRY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </section>

              {/* ── Location ──────────────────────────────────── */}
              <section>
                <SectionLabel>2. Location</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Province *" error={errors.province}>
                    <select className={`input appearance-none${errors.province ? ' input-error' : ''}`}
                      value={form.province}
                      onChange={(e) => { set('province', e.target.value); set('city', '') }}>
                      <option value="">Select province…</option>
                      {Object.entries(PROVINCE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="City *" error={errors.city}>
                    {cities.length > 0 ? (
                      <select className={`input appearance-none${errors.city ? ' input-error' : ''}`}
                        value={form.city} onChange={(e) => set('city', e.target.value)}>
                        <option value="">Select city…</option>
                        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input className={`input${errors.city ? ' input-error' : ''}`}
                        placeholder="City name" value={form.city}
                        onChange={(e) => set('city', e.target.value)} />
                    )}
                  </Field>
                </div>
              </section>

              {/* ── Listing Type ──────────────────────────────── */}
              <section>
                <SectionLabel>3. What Are You Seeking?</SectionLabel>
                <Field label="Opportunity Type *" error={errors.listingType}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        key: 'isForSale' as const,
                        label: 'Is for sale',
                        desc: 'Accept buyer and acquisition conversations',
                        checked: opportunityIntent.isForSale,
                      },
                      {
                        key: 'isSeekingInvestment' as const,
                        label: 'Is seeking investment',
                        desc: 'Accept investor conversations for funding',
                        checked: opportunityIntent.isSeekingInvestment,
                      },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setOpportunityIntent(item.key, !item.checked)}
                        className="w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-all duration-150"
                        style={
                          item.checked
                            ? { background: 'rgba(139,92,246,0.15)', border: '1.5px solid rgba(139,92,246,0.5)' }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
                        }
                        aria-pressed={item.checked}
                      >
                        <span
                          className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white shrink-0"
                          style={{
                            background: item.checked ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
                            border: item.checked ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.16)',
                          }}
                        >
                          {item.checked ? '✓' : ''}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                          <span className="block text-xs text-fg-3">{item.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>
              </section>

              {/* ── Business Stage ────────────────────────────── */}
              <section>
                <SectionLabel>4. Business Stage</SectionLabel>
                <select className="input appearance-none" value={form.stage} onChange={(e) => set('stage', e.target.value)}>
                  {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </section>

              {/* ── Financials ────────────────────────────────── */}
              <section>
                <SectionLabel>5. Financials (PKR) — Optional but recommended</SectionLabel>
                <div className="rounded-2xl px-4 py-3 mb-4 text-xs leading-relaxed"
                     style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(253,186,116,0.8)' }}>
                  ⚠ Only enter accurate, verifiable figures. Misleading data may result in account suspension.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'askingPrice', label: 'Funding Required',                placeholder: '25000000' },
                    { key: 'revenue',     label: 'Revenue Range',                   placeholder: '10000000' },
                    { key: 'profit',      label: 'Annual Profit / EBITDA',          placeholder: '3000000'  },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      <input type="number" className="input" placeholder={f.placeholder} min="0"
                        value={(form as unknown as Record<string, string>)[f.key]}
                        onChange={(e) => set(f.key as keyof BusinessFormData, e.target.value)} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="label">No. of Employees</label>
                    <input type="number" className="input" placeholder="25" min="1"
                      value={form.employees} onChange={(e) => set('employees', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Year Established</label>
                    <input type="number" className="input" placeholder="2015" min="1800" max={new Date().getFullYear()}
                      value={form.established} onChange={(e) => set('established', e.target.value)} />
                  </div>
                </div>
              </section>

              {/* ── Key Highlights ────────────────────────────── */}
              <section>
                <SectionLabel>6. Key Highlights (up to 6)</SectionLabel>
                <div className="flex gap-2 mb-3">
                  <input
                    className="input flex-1 text-sm"
                    placeholder="e.g. ISO 9001 certified, debt-free, 5-year contract…"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    disabled={form.highlights.length >= 6}
                  />
                  <button type="button" onClick={addTag}
                    disabled={!tagInput.trim() || form.highlights.length >= 6}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.highlights.map((h, i) => (
                    <span key={h} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' }}>
                      ✓ {h}
                      <button type="button" onClick={() => removeTag(i)}
                        className="ml-1 opacity-60 hover:opacity-100 transition-opacity" aria-label={`Remove ${h}`}>
                        ✕
                      </button>
                    </span>
                  ))}
                  {form.highlights.length === 0 && (
                    <p className="text-xs text-fg-3">No highlights yet — add up to 6</p>
                  )}
                </div>
              </section>

              {/* ── Images ───────────────────────────────────────── */}
              <section>
                <SectionLabel>7. Business Images (up to 5)</SectionLabel>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => handleFiles(e.target.files)} />

                {imagePreviews.length < 5 && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl transition-all text-sm text-fg-3 hover:text-fg-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px dashed rgba(255,255,255,0.12)' }}>
                    <span className="text-3xl">🖼️</span>
                    <span>Click to upload images</span>
                    <span className="text-xs text-fg-3">PNG, JPG up to 5MB each · max 5 images</span>
                  </button>
                )}

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                        <button type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                          aria-label={`Remove image ${i + 1}`}>
                          ✕
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < 5 && (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="aspect-square rounded-xl flex items-center justify-center text-2xl text-fg-3 hover:text-fg-2 transition-colors"
                        style={{ border: '1.5px dashed rgba(255,255,255,0.12)' }} aria-label="Add more images">
                        +
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* Bottom spacer */}
              <div className="h-4" />
            </div>

            {/* Sticky footer with actions */}
            <div className="shrink-0 px-7 py-5 flex gap-3"
                 style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(14,14,18,0.95)' }}>
              <button type="button" onClick={() => handleSubmit('DRAFT')} disabled={loading}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {loading ? '…' : '💾 Save Draft'}
              </button>
              <button type="button" onClick={() => handleSubmit('DRAFT', true)} disabled={loading}
                className="flex-[2] py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', boxShadow: '0 4px 15px rgba(107,33,168,0.4)' }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Submitting…
                  </span>
                ) : '🚀 Submit for Review'}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
