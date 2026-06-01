'use client'

import { useState, FormEvent, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CITIES_BY_PROVINCE, ROLE_META, AppRole } from '@/lib/constants'
import { getPasswordStrength } from '@/lib/validation'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { useLoading } from '@/hooks/useLoading'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  name:            string
  email:           string
  password:        string
  confirmPassword: string
  phone:           string
  city:            string
}

interface FieldErrors {
  name?:            string
  email?:           string
  password?:        string
  confirmPassword?: string
  phone?:           string
  city?:            string
  general?:         string
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

// ── Password strength bar ─────────────────────────────────────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null
  const { score, label, color } = getPasswordStrength(password)
  const pct = Math.min(100, (score / 6) * 100)

  const rules = [
    { met: password.length >= 8,   text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ]

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs font-semibold capitalize shrink-0" style={{ color }}>
          {label.replace('-', ' ')}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {rules.map((r) => (
          <div key={r.text} className="flex items-center gap-1.5">
            <span style={{ color: r.met ? '#10B981' : 'rgba(255,255,255,0.25)' }}>
              {r.met ? <CheckIcon /> : <span className="text-[10px]">○</span>}
            </span>
            <span className="text-[11px]" style={{ color: r.met ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>
              {r.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step 1 — Role selection ───────────────────────────────────────────────────

const ROLES: AppRole[] = ['BUSINESS_OWNER', 'INVESTOR', 'BUYER']

const ROLE_COLORS: Record<AppRole, { border: string; bg: string; glow: string; dot: string }> = {
  BUSINESS_OWNER: { border: '#D97706', bg: 'rgba(217,119,6,0.08)',    glow: 'rgba(217,119,6,0.2)',    dot: '#D97706' },
  INVESTOR:       { border: '#10B981', bg: 'rgba(16,185,129,0.08)',   glow: 'rgba(16,185,129,0.2)',   dot: '#10B981' },
  BUYER:          { border: '#3B82F6', bg: 'rgba(59,130,246,0.08)',   glow: 'rgba(59,130,246,0.2)',   dot: '#3B82F6' },
}

function RoleStep({
  selected,
  onSelect,
  onNext,
}: {
  selected: AppRole | ''
  onSelect: (r: AppRole) => void
  onNext: () => void
}) {
  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-foreground mb-1.5">
          What brings you to Finvest?
        </h1>
        <p className="text-fg-2 text-sm">Choose your role — you can always change it later.</p>
      </div>

      <div className="space-y-3">
        {ROLES.map((role) => {
          const meta   = ROLE_META[role]
          const colors = ROLE_COLORS[role]
          const isActive = selected === role

          return (
            <button
              key={role}
              type="button"
              onClick={() => onSelect(role)}
              className="w-full flex items-start gap-4 p-5 rounded-3xl text-left transition-all duration-200"
              style={{
                background:   isActive ? colors.bg    : 'rgba(255,255,255,0.03)',
                border:       `1.5px solid ${isActive ? colors.border : 'rgba(255,255,255,0.09)'}`,
                boxShadow:    isActive ? `0 0 24px ${colors.glow}` : 'none',
              }}
              aria-pressed={isActive}
            >
              {/* Emoji icon */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                   style={{ background: isActive ? colors.bg : 'rgba(255,255,255,0.04)', border: `1px solid ${isActive ? colors.border : 'rgba(255,255,255,0.08)'}` }}>
                {meta.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-foreground">{meta.label}</span>
                  {isActive && (
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]"
                          style={{ background: colors.dot }}>
                      <CheckIcon />
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium mb-1" style={{ color: isActive ? colors.border : 'rgba(255,255,255,0.4)' }}>
                  {meta.tagline}
                </p>
                <p className="text-xs leading-relaxed text-fg-3">{meta.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!selected}
        className="mt-6 w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: selected ? 'linear-gradient(135deg, #6B21A8, #8B5CF6)' : 'rgba(255,255,255,0.1)',
          boxShadow: selected ? '0 4px 20px rgba(107,33,168,0.4)' : 'none',
        }}
      >
        Continue →
      </button>
    </div>
  )
}

// ── Shared form field (must live outside DetailsStep — nested components remount on every keystroke) ──

function SignupField({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  error,
  autoComplete,
  children,
  hint,
  required = true,
  loading,
  onChange,
}: {
  id: keyof FormData
  label: string
  type?: string
  placeholder?: string
  value: string
  error?: string
  autoComplete?: string
  children?: React.ReactNode
  hint?: string
  required?: boolean
  loading: boolean
  onChange: (field: keyof FormData, value: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {!required && (
          <span className="ml-1 font-normal normal-case tracking-normal" style={{ color: 'rgba(255,255,255,0.3)' }}>
            optional
          </span>
        )}
      </label>
      <div className="relative">
        {children ?? (
          <input
            id={id}
            type={type}
            className={`input${error ? ' input-error' : ''}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(id, e.target.value)}
            autoComplete={autoComplete}
            disabled={loading}
          />
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400" role="alert">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-fg-3">{hint}</p>}
    </div>
  )
}

// ── Step 2 — Details form ─────────────────────────────────────────────────────

function DetailsStep({
  role,
  form,
  errors,
  loading,
  onChange,
  onBack,
  onSubmit,
}: {
  role:     AppRole
  form:     FormData
  errors:   FieldErrors
  loading:  boolean
  onChange: (field: keyof FormData, value: string) => void
  onBack:   () => void
  onSubmit: (e: FormEvent) => void
}) {
  const [showPw,   setShowPw]   = useState(false)
  const [showCpw,  setShowCpw]  = useState(false)
  const meta   = ROLE_META[role]
  const colors = ROLE_COLORS[role]

  return (
    <div className="animate-fade-up">
      <div className="mb-7">
        {/* Role pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
             style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.border }}>
          <span>{meta.emoji}</span>
          <span>Joining as {meta.label}</span>
          <button type="button" onClick={onBack} className="ml-1 opacity-70 hover:opacity-100 transition-opacity" aria-label="Change role">✕</button>
        </div>

        <h1 className="font-display font-black text-3xl text-foreground mb-1">Create your account</h1>
        <p className="text-fg-2 text-sm">All fields marked * are required.</p>
      </div>

      {errors.general && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
             style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}
             role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {errors.general}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {/* Row 1: Name + Email */}
        <div className="grid sm:grid-cols-2 gap-4">
          <SignupField id="name" label="Full Name *" placeholder="Ahmed Khan" value={form.name}
                 error={errors.name} autoComplete="name" loading={loading} onChange={onChange} />
          <SignupField id="email" label="Email Address *" type="email" placeholder="ahmed@example.com"
                 value={form.email} error={errors.email} autoComplete="email" loading={loading} onChange={onChange} />
        </div>

        {/* Row 2: Phone + City */}
        <div className="grid sm:grid-cols-2 gap-4">
          <SignupField id="phone" label="Phone Number" placeholder="+92 300 1234567" value={form.phone}
                 error={errors.phone} autoComplete="tel" required={false}
                 hint="Pakistani number, e.g. +923001234567" loading={loading} onChange={onChange} />

          {/* City dropdown with optgroups */}
          <div>
            <label htmlFor="city" className="label">City / Location *</label>
            <div className="relative">
              <select
                id="city"
                className={`input appearance-none pr-9 cursor-pointer${errors.city ? ' input-error' : ''}`}
                value={form.city}
                onChange={(e) => onChange('city', e.target.value)}
                disabled={loading}
              >
                <option value="">Select your city</option>
                {Object.entries(CITIES_BY_PROVINCE).map(([province, cities]) => (
                  <optgroup key={province} label={province}>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                ))}
              </select>
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-fg-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </div>
            {errors.city && <p className="mt-1.5 text-xs text-red-400" role="alert">{errors.city}</p>}
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="label">Password *</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className={`input pr-11${errors.password ? ' input-error' : ''}`}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => onChange('password', e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-3 hover:text-foreground transition-colors p-1"
                    aria-label={showPw ? 'Hide password' : 'Show password'} tabIndex={-1}>
              <EyeIcon off={showPw} />
            </button>
          </div>
          {errors.password
            ? <p className="mt-1.5 text-xs text-red-400" role="alert">{errors.password}</p>
            : <PasswordStrengthBar password={form.password} />
          }
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="label">Confirm Password *</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showCpw ? 'text' : 'password'}
              className={`input pr-11${errors.confirmPassword ? ' input-error' : ''}`}
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
            <button type="button" onClick={() => setShowCpw(!showCpw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-3 hover:text-foreground transition-colors p-1"
                    aria-label={showCpw ? 'Hide password' : 'Show password'} tabIndex={-1}>
              <EyeIcon off={showCpw} />
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-400" role="alert">{errors.confirmPassword}</p>
          )}
          {!errors.confirmPassword && form.confirmPassword && form.password === form.confirmPassword && (
            <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: '#10B981' }}>
              <CheckIcon /> Passwords match
            </p>
          )}
        </div>

        {/* Legal disclaimer */}
        <div className="rounded-2xl p-4 text-xs leading-relaxed"
             style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', color: 'rgba(253,186,116,0.8)' }}>
          <span className="font-semibold text-amber-400">⚠ Disclaimer: </span>
          By creating an account you acknowledge that Finvest only facilitates connections and does not provide financial advice, handle funds, or guarantee any transactions. You are solely responsible for your own due diligence.
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onBack}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-fg-2 hover:text-foreground transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  disabled={loading}>
            ← Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-3 rounded-2xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
              boxShadow: '0 4px 15px rgba(107,33,168,0.4)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Creating account…
              </span>
            ) : 'Create Account →'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter()
  const { startLoading, stopLoading } = useLoading()

  const [step,    setStep]    = useState<1 | 2>(1)
  const [role,    setRole]    = useState<AppRole | ''>('')
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState<FieldErrors>({})

  const [form, setForm] = useState<FormData>({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
    phone:           '',
    city:            '',
  })

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  // Client-side validation
  function validate(): boolean {
    const e: FieldErrors = {}

    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))  e.email = 'Enter a valid email address.'
    if (form.password.length < 8)                               e.password = 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(form.password))                           e.password = 'Password needs an uppercase letter.'
    if (!/[a-z]/.test(form.password))                           e.password = 'Password needs a lowercase letter.'
    if (!/[0-9]/.test(form.password))                           e.password = 'Password needs a number.'
    if (form.password !== form.confirmPassword)                  e.confirmPassword = 'Passwords do not match.'
    if (!form.city)                                              e.city = 'Please select your city.'
    if (form.phone && !/^(\+92|0)[0-9]{10}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      e.phone = 'Enter a valid Pakistani number (+923001234567).'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    startLoading()
    setErrors({})

    let navigating = false
    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:            form.name.trim(),
          email:           form.email.trim().toLowerCase(),
          password:        form.password,
          confirmPassword: form.confirmPassword,
          role,
          phone:           form.phone.replace(/[\s-]/g, '') || undefined,
          city:            form.city,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.field) {
          setErrors({ [data.field]: data.error })
          if (data.field !== 'general') setStep(2)
        } else {
          setErrors({ general: data.error ?? 'Registration failed. Please try again.' })
        }
        return
      }

      navigating = true
      router.push(data.redirect ?? '/dashboard/business')
      router.refresh()
    } catch {
      setErrors({ general: 'Network error — please try again.' })
    } finally {
      setLoading(false)
      if (!navigating) stopLoading()
    }
  }

  // Step indicator
  const steps = ['Choose role', 'Your details']

  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}>
              <span className="font-black text-white">F</span>
            </div>
            <span className="font-display font-black text-xl tracking-tight"
                  style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Finvest
            </span>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {steps.map((label, i) => {
            const n       = i + 1
            const active  = step === n
            const done    = step > n
            return (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      background: done ? '#10B981' : active ? 'linear-gradient(135deg, #6B21A8, #8B5CF6)' : 'rgba(255,255,255,0.08)',
                      color: done || active ? '#fff' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {done ? <CheckIcon /> : n}
                  </div>
                  <span className="text-xs font-medium hidden sm:block"
                        style={{ color: active ? 'rgb(var(--fg))' : 'rgba(255,255,255,0.3)' }}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-10 h-px transition-all duration-300"
                       style={{ background: step > n ? '#10B981' : 'rgba(255,255,255,0.12)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div
          className="w-full max-w-xl rounded-3xl p-8 sm:p-10"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
          }}
        >
          {step === 1
            ? <RoleStep selected={role} onSelect={setRole} onNext={() => role && setStep(2)} />
            : <DetailsStep
                role={role as AppRole}
                form={form}
                errors={errors}
                loading={loading}
                onChange={handleChange}
                onBack={() => setStep(1)}
                onSubmit={handleSubmit}
              />
          }
        </div>

        {/* Sign-in link */}
        <p className="mt-6 text-sm text-fg-2">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold transition-colors" style={{ color: 'rgb(139,92,246)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
