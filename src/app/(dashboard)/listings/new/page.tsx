'use client'
import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { INDUSTRY_LABELS, PROVINCE_LABELS } from '@/lib/utils'

export default function NewListingPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [highlight, setHighlight] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'INVESTMENT',
    industry: 'TECHNOLOGY',
    city: '',
    province: 'PUNJAB',
    askingPrice: '',
    revenue: '',
    profit: '',
    employees: '',
    established: '',
    highlights: [] as string[],
  })

  useEffect(() => {
    fetch('/api/auth/me').then((r) => {
      if (!r.ok) router.push('/login?redirect=/listings/new')
      else setAuthChecked(true)
    })
  }, [router])

  const addHighlight = () => {
    if (highlight.trim() && form.highlights.length < 6) {
      setForm({ ...form, highlights: [...form.highlights, highlight.trim()] })
      setHighlight('')
    }
  }

  const removeHighlight = (i: number) => {
    setForm({ ...form, highlights: form.highlights.filter((_, idx) => idx !== i) })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        askingPrice: form.askingPrice ? parseFloat(form.askingPrice) : null,
        revenue: form.revenue ? parseFloat(form.revenue) : null,
        profit: form.profit ? parseFloat(form.profit) : null,
        employees: form.employees ? parseInt(form.employees) : null,
        established: form.established ? parseInt(form.established) : null,
      }
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create listing'); return }
      router.push(`/businesses/${data.data.id}`)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: string, value: string) => setForm({ ...form, [key]: value })

  if (!authChecked) return <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Create a Listing</h1>
        <p className="text-gray-500 text-sm mt-1">List your business for investment, acquisition, or partnership.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 mb-4">Basic Information</h2>
          <div>
            <label className="label">Listing Title *</label>
            <input className="input" placeholder="e.g. Profitable Textile Mill Seeking Investor" value={form.title}
              onChange={(e) => set('title', e.target.value)} required minLength={5} />
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea className="input h-36 resize-none" placeholder="Describe your business, what you're offering, and what kind of partner you're looking for…"
              value={form.description} onChange={(e) => set('description', e.target.value)} required minLength={20} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Opportunity Type *</label>
              <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="INVESTMENT">Investment</option>
                <option value="ACQUISITION">Acquisition</option>
                <option value="PARTNERSHIP">Partnership</option>
              </select>
            </div>
            <div>
              <label className="label">Industry *</label>
              <select className="input" value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                {Object.entries(INDUSTRY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Province *</label>
              <select className="input" value={form.province} onChange={(e) => set('province', e.target.value)}>
                {Object.entries(PROVINCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">City *</label>
            <input className="input" placeholder="Lahore" value={form.city}
              onChange={(e) => set('city', e.target.value)} required />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Financial Details <span className="text-gray-400 font-normal text-sm">(optional but recommended)</span></h2>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg mb-4">
            ⚠ Only enter accurate, verifiable figures. All amounts in PKR (Pakistani Rupees).
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'askingPrice', label: 'Asking Price (PKR)', placeholder: '25000000' },
              { key: 'revenue', label: 'Annual Revenue (PKR)', placeholder: '10000000' },
              { key: 'profit', label: 'Annual Profit (PKR)', placeholder: '3000000' },
              { key: 'employees', label: 'No. of Employees', placeholder: '25' },
              { key: 'established', label: 'Year Established', placeholder: '2015' },
            ].map((f) => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input type="number" className="input" placeholder={f.placeholder}
                  value={(form as any)[f.key]} onChange={(e) => set(f.key, e.target.value)} min="0" />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Key Highlights <span className="text-gray-400 font-normal text-sm">(up to 6)</span></h2>
          <div className="flex gap-2 mb-3">
            <input className="input flex-1" placeholder="e.g. ISO 9001 certified" value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHighlight() } }}
            />
            <button type="button" onClick={addHighlight} className="btn-secondary px-4">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.highlights.map((h, i) => (
              <span key={i} className="bg-[#01411C]/10 text-[#01411C] text-sm px-3 py-1 rounded-full flex items-center gap-1.5">
                {h}
                <button type="button" onClick={() => removeHighlight(i)} className="text-[#01411C]/50 hover:text-red-600">✕</button>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠ Legal Acknowledgement</p>
          <p>By submitting this listing, you confirm that all information is accurate. Finvest does not verify listings and is not liable for any transactions arising from connections made through this platform.</p>
        </div>

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1 py-3" disabled={loading}>
            {loading ? 'Publishing…' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  )
}
