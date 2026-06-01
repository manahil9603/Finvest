'use client'

import { useState, FormEvent } from 'react'
import { useToast } from '@/hooks/useToast'

const SUBJECTS = [
  'General Enquiry',
  'Technical Support',
  'Listing Help',
  'Verification Request',
  'Partnership Opportunity',
  'Report an Issue',
  'Other',
]

export function ContactForm() {
  const { success, error: showError } = useToast()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.name.trim()    || form.name.trim().length < 2)     e.name    = 'Please enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))   e.email   = 'Please enter a valid email address.'
    if (!form.subject)                                             e.subject = 'Please select a subject.'
    if (!form.message.trim() || form.message.trim().length < 20)  e.message = 'Message must be at least 20 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    // Simulate API call — replace with actual email service (e.g. Resend, SendGrid)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
    success('Message sent!', "We'll get back to you within 24–48 hours.")
  }

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5"
          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          ✅
        </div>
        <h3 className="font-display font-bold text-xl text-foreground mb-2">Message received!</h3>
        <p className="text-fg-2 text-sm max-w-xs leading-relaxed">
          Thank you for reaching out. Our team will respond to <strong>{form.email}</strong> within 24–48 business hours.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
          className="mt-6 text-xs font-semibold"
          style={{ color: '#A78BFA' }}
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input
            className={`input${errors.name ? ' input-error' : ''}`}
            placeholder="Ahmed Khan"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="label">Email Address *</label>
          <input
            type="email"
            className={`input${errors.email ? ' input-error' : ''}`}
            placeholder="ahmed@example.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label className="label">Subject *</label>
        <select
          className={`input appearance-none${errors.subject ? ' input-error' : ''}`}
          value={form.subject}
          onChange={(e) => set('subject', e.target.value)}
        >
          <option value="">Select a topic…</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.subject && <p className="text-xs text-red-400 mt-1">{errors.subject}</p>}
      </div>

      <div>
        <label className="label">Message *</label>
        <textarea
          className={`input resize-none h-36${errors.message ? ' input-error' : ''}`}
          placeholder="Describe your question or issue in detail…"
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          maxLength={2000}
        />
        <div className="flex justify-between mt-1">
          {errors.message
            ? <p className="text-xs text-red-400">{errors.message}</p>
            : <span />
          }
          <p className="text-[11px] text-fg-3">{form.message.length}/2000</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
        style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', boxShadow: '0 4px 15px rgba(107,33,168,0.4)' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Sending…
          </span>
        ) : '📩 Send Message'}
      </button>
    </form>
  )
}
