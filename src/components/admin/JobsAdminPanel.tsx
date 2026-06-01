'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { EMPLOYMENT_LABELS } from '@/lib/jobs-display'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'

type JobRow = {
  id:              string
  title:           string
  department:      string | null
  location:        string
  description:     string
  employmentType:  string
  active:          boolean
  applyEmail:      string | null
  createdAt:       string
  updatedAt:       string
}

const EMPLOYMENT_KEYS = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const

export function JobsAdminPanel() {
  const { success, error: showError } = useToast()
  const [jobs, setJobs]     = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)

  const [title, setTitle]             = useState('')
  const [department, setDepartment]   = useState('')
  const [location, setLocation]       = useState('')
  const [description, setDescription] = useState('')
  const [employmentType, setEmploymentType] =
    useState<(typeof EMPLOYMENT_KEYS)[number]>('FULL_TIME')
  const [applyEmail, setApplyEmail]   = useState('')
  const [active, setActive]           = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)

  const fetchJobs = useCallback(async () => {
    const res = await fetch('/api/admin/jobs')
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      showError('Error', data.error ?? 'Failed to load jobs')
      return
    }
    setJobs(data.jobs as JobRow[])
  }, [showError])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitLoading(true)
    const res = await fetch('/api/admin/jobs', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({
        title,
        department: department.trim() || null,
        location,
        description,
        employmentType,
        active,
        applyEmail: applyEmail.trim() || '',
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSubmitLoading(false)
    if (!res.ok) {
      showError('Error', typeof data.error === 'string' ? data.error : 'Could not save')
      return
    }
    success('Saved', 'Job posting created.')
    setJobs((prev) => [data.job as JobRow, ...prev])
    setTitle('')
    setDepartment('')
    setLocation('')
    setDescription('')
    setApplyEmail('')
    setActive(true)
    setEmploymentType('FULL_TIME')
  }

  async function toggleActive(job: JobRow) {
    const res = await fetch(`/api/admin/jobs/${job.id}`, {
      method:      'PATCH',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({ active: !job.active }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      showError('Error', typeof data.error === 'string' ? data.error : 'Update failed')
      return
    }
    success(
      'Updated',
      job.active ? 'Posting hidden from the careers page.' : 'Posting is now live.',
    )
    setJobs((prev) => prev.map((j) => (j.id === job.id ? (data.job as JobRow) : j)))
  }

  async function removeJob(job: JobRow) {
    if (!confirm(`Delete “${job.title}”? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/jobs/${job.id}`, { method: 'DELETE', credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      showError('Error', typeof data.error === 'string' ? data.error : 'Delete failed')
      return
    }
    success('Deleted', 'Job removed.')
    setJobs((prev) => prev.filter((j) => j.id !== job.id))
  }

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Link
            href="/admin"
            className="text-xs font-semibold text-brand-purple-light hover:underline mb-2 inline-block"
          >
            ← Control Centre
          </Link>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
            Careers — job postings
          </h1>
          <p className="text-sm text-fg-3 mt-1 max-w-xl">
            Create roles that appear on <strong className="text-fg-2 font-semibold">/careers</strong>. Only postings
            marked <strong className="text-fg-2 font-semibold">active</strong> are visible to visitors.
          </p>
        </div>
        <Link
          href="/careers"
          className="text-sm font-semibold text-brand-purple-light hover:underline shrink-0"
          target="_blank"
          rel="noopener noreferrer"
        >
          View public careers ↗
        </Link>
      </div>

      <section
        className="rounded-3xl p-6 sm:p-8"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <h2 className="font-display font-bold text-lg text-foreground mb-4">New posting</h2>
        <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-fg-3 mb-1.5" htmlFor="job-title">
              Title
            </label>
            <input
              id="job-title"
              className="input w-full text-sm"
              required
              minLength={2}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product Designer"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-fg-3 mb-1.5" htmlFor="job-dept">
                Team / department <span className="font-normal text-fg-3 lowercase">(optional)</span>
              </label>
              <input
                id="job-dept"
                className="input w-full text-sm"
                maxLength={120}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Product"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-fg-3 mb-1.5" htmlFor="job-loc">
                Location
              </label>
              <input
                id="job-loc"
                className="input w-full text-sm"
                required
                maxLength={200}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Islamabad · Hybrid"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-fg-3 mb-1.5" htmlFor="job-type">
              Employment type
            </label>
            <select
              id="job-type"
              className="input w-full text-sm"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as (typeof EMPLOYMENT_KEYS)[number])}
            >
              {EMPLOYMENT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {EMPLOYMENT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-fg-3 mb-1.5" htmlFor="job-desc">
              Description
            </label>
            <textarea
              id="job-desc"
              className="input w-full text-sm min-h-[140px] resize-y"
              required
              minLength={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What they’ll do, what you’re looking for, and how to stand out."
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-fg-3 mb-1.5" htmlFor="job-email">
              Apply email <span className="font-normal text-fg-3 lowercase">(optional)</span>
            </label>
            <input
              id="job-email"
              type="email"
              className="input w-full text-sm"
              value={applyEmail}
              onChange={(e) => setApplyEmail(e.target.value)}
              placeholder="careers@example.com"
            />
            <p className="text-[11px] text-fg-3 mt-1">If empty, the careers page shows a generic contact note.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span className="text-sm text-fg-2">Visible on careers page (active)</span>
          </label>
          <button
            type="submit"
            disabled={submitLoading}
            className="px-6 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}
          >
            {submitLoading ? 'Saving…' : 'Create posting'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display font-bold text-lg text-foreground mb-4">All postings</h2>
        {loading ? (
          <p className="text-fg-3 text-sm">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="text-fg-2 text-sm">No postings yet. Create one above.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const typeLabel = EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType
              return (
                <div
                  key={job.id}
                  className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-foreground">{job.title}</h3>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={
                          job.active
                            ? { background: 'rgba(16,185,129,0.12)', color: '#34D399' }
                            : { background: 'rgba(245,158,11,0.12)', color: '#FCD34D' }
                        }
                      >
                        {job.active ? 'Live' : 'Hidden'}
                      </span>
                      <span className="text-[11px] text-fg-3">{typeLabel}</span>
                    </div>
                    <p className="text-xs text-fg-3 mb-2">
                      {job.department && <span className="text-fg-2">{job.department} · </span>}
                      {job.location}
                      {job.applyEmail && (
                        <>
                          {' '}
                          · <span className="text-fg-2">{job.applyEmail}</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-fg-3">Updated {formatDate(job.updatedAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleActive(job)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={
                        job.active
                          ? { background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)' }
                          : { background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }
                      }
                    >
                      {job.active ? 'Hide' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeJob(job)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/15 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
