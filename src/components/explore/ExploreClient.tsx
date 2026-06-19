'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BusinessCard } from './BusinessCard'
import { FilterSidebar } from './FilterSidebar'
import { SkeletonGrid } from './BusinessSkeleton'
import { DEFAULT_FILTERS, SORT_OPTIONS, type FilterState, type BusinessResult, type PaginationMeta } from './types'

// ─────────────────────────────────────────────────────────────
// URL ↔ FilterState helpers
// ─────────────────────────────────────────────────────────────

function paramsToFilters(sp: URLSearchParams): FilterState {
  return {
    q:              sp.get('q')              ?? '',
    industry:       sp.get('industry')       ?? '',
    province:       sp.get('province')       ?? '',
    listingType:    sp.get('listingType')    ?? '',
    stages:         sp.get('stage')          ? sp.get('stage')!.split(',').filter(Boolean) : [],
    minAskingPrice: sp.get('minAskingPrice') ? Number(sp.get('minAskingPrice')) : 0,
    maxAskingPrice: sp.get('maxAskingPrice') ? Number(sp.get('maxAskingPrice')) : 0,
    minRevenue:     sp.get('minRevenue')     ? Number(sp.get('minRevenue'))     : 0,
    maxRevenue:     sp.get('maxRevenue')     ? Number(sp.get('maxRevenue'))     : 0,
    verifiedOnly:   sp.get('verifiedOnly')   === 'true',
    seekingOperator: sp.get('seekingOperator') === 'true',
    minTrustScore:  sp.get('minTrustScore')  ? Number(sp.get('minTrustScore'))  : 0,
    sortBy:         (sp.get('sortBy')        ?? 'featured') as FilterState['sortBy'],
    page:           sp.get('page')           ? Math.max(1, Number(sp.get('page'))) : 1,
  }
}

function filtersToParams(f: FilterState): string {
  const sp = new URLSearchParams()
  if (f.q)              sp.set('q',              f.q)
  if (f.industry)       sp.set('industry',       f.industry)
  if (f.province)       sp.set('province',       f.province)
  if (f.listingType)    sp.set('listingType',    f.listingType)
  if (f.stages.length)  sp.set('stage',          f.stages.join(','))
  if (f.minAskingPrice) sp.set('minAskingPrice', String(f.minAskingPrice))
  if (f.maxAskingPrice) sp.set('maxAskingPrice', String(f.maxAskingPrice))
  if (f.minRevenue)     sp.set('minRevenue',     String(f.minRevenue))
  if (f.maxRevenue)     sp.set('maxRevenue',     String(f.maxRevenue))
  if (f.verifiedOnly)   sp.set('verifiedOnly',   'true')
  if (f.seekingOperator) sp.set('seekingOperator', 'true')
  if (f.minTrustScore)  sp.set('minTrustScore',  String(f.minTrustScore))
  if (f.sortBy !== 'featured') sp.set('sortBy',  f.sortBy)
  if (f.page > 1)       sp.set('page',           String(f.page))
  return sp.toString()
}

function countActiveFilters(f: FilterState): number {
  let n = 0
  if (f.q)              n++
  if (f.industry)       n++
  if (f.province)       n++
  if (f.listingType)    n++
  if (f.stages.length)  n++
  if (f.minAskingPrice || f.maxAskingPrice) n++
  if (f.minRevenue     || f.maxRevenue)     n++
  if (f.verifiedOnly)   n++
  if (f.seekingOperator) n++
  if (f.minTrustScore)  n++
  if (f.sortBy !== 'featured') n++
  return n
}

// ─────────────────────────────────────────────────────────────
// Search bar
// ─────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => { setLocal(value) }, [value])

  const handle = (v: string) => {
    setLocal(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(v), 380)
  }

  return (
    <div className="relative flex-1 min-w-0">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: 'rgba(255,255,255,0.35)' }} aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="search"
        className="input pl-11 pr-10 h-11 text-sm"
        placeholder="Search by name, industry, or keyword…"
        value={local}
        onChange={(e) => handle(e.target.value)}
        aria-label="Search businesses"
      />
      {local && (
        <button
          type="button"
          onClick={() => handle('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────

function Pagination({ meta, onChange }: { meta: PaginationMeta; onChange: (page: number) => void }) {
  if (meta.pages <= 1) return null

  const pages = Array.from({ length: Math.min(meta.pages, 7) }, (_, i) => {
    if (meta.pages <= 7) return i + 1
    if (i === 0) return 1
    if (i === 6) return meta.pages
    if (meta.page <= 4) return i + 1
    if (meta.page >= meta.pages - 3) return meta.pages - 6 + i
    return meta.page - 3 + i
  })

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label="Pagination">
      <button
        onClick={() => onChange(meta.page - 1)}
        disabled={meta.page === 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl disabled:opacity-30 transition-all hover:bg-surface/10"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        aria-label="Previous page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      {pages.map((p, i) => {
        const isPrev = i > 0 && p > (pages[i - 1]!) + 1
        return (
          <span key={`${p}-${i}`} className="flex items-center gap-1.5">
            {isPrev && <span className="text-fg-3 text-sm">…</span>}
            <button
              onClick={() => onChange(p)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all"
              style={
                p === meta.page
                  ? { background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }
              }
              aria-current={p === meta.page ? 'page' : undefined}
            >
              {p}
            </button>
          </span>
        )
      })}

      <button
        onClick={() => onChange(meta.page + 1)}
        disabled={meta.page === meta.pages}
        className="w-9 h-9 flex items-center justify-center rounded-xl disabled:opacity-30 transition-all hover:bg-surface/10"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        aria-label="Next page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      <span className="text-xs text-fg-3 ml-2 hidden sm:block">
        {meta.total.toLocaleString()} result{meta.total !== 1 ? 's' : ''}
      </span>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────
// Main client component
// ─────────────────────────────────────────────────────────────

interface Props {
  currentUserId?: string | null
}

export function ExploreClient({ currentUserId }: Props) {
  const router     = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Initialise from URL params
  const [filters,     setFilters]     = useState<FilterState>(() => paramsToFilters(searchParams))
  const [businesses,  setBusinesses]  = useState<BusinessResult[]>([])
  const [meta,        setMeta]        = useState<PaginationMeta>({ total: 0, page: 1, pages: 1, limit: 12 })
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  // ── Fetch businesses ───────────────────────────────────────
  const fetch_ = useCallback(async (f: FilterState) => {
    setLoading(true)
    setError(null)
    try {
      const qs  = filtersToParams(f)
      const res = await fetch(`/api/businesses?${qs}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load')
      setBusinesses(json.data ?? [])
      setMeta(json.meta ?? { total: 0, page: 1, pages: 1, limit: 12 })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Sync URL → state when user navigates back ──────────────
  useEffect(() => {
    const f = paramsToFilters(searchParams)
    setFilters(f)
    fetch_(f)
  }, [searchParams, fetch_])

  // ── Patch filters + update URL ─────────────────────────────
  const updateFilters = useCallback(
    (patch: Partial<FilterState>) => {
      setFilters((prev) => {
        const next: FilterState = { ...prev, ...patch }
        // Any filter change resets to page 1 unless explicitly set
        if (!('page' in patch)) next.page = 1
        startTransition(() => {
          const qs = filtersToParams(next)
          router.replace(qs ? `/explore?${qs}` : '/explore', { scroll: false })
        })
        return next
      })
    },
    [router]
  )

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    startTransition(() => { router.replace('/explore', { scroll: false }) })
  }, [router])

  const changePage = useCallback(
    (page: number) => {
      updateFilters({ page })
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    },
    [updateFilters]
  )

  const activeCount = countActiveFilters(filters)

  // ── Sidebar glass styles ───────────────────────────────────
  const sidebarStyle: React.CSSProperties = {
    background:          'rgba(12,12,14,0.97)',
    backdropFilter:      'blur(24px)',
    WebkitBackdropFilter:'blur(24px)',
    borderRight:         '1px solid rgba(255,255,255,0.08)',
  }

  return (
    <div className="min-h-screen">
      {/* ── Page header ───────────────────────────────────── */}
      <div
        className="sticky top-16 z-30 border-b"
        style={{ background: 'rgba(10,10,12,0.9)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="page-container py-3">
          <div className="flex items-center gap-3">
            {/* Filter toggle (mobile + desktop sidebar toggle) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold shrink-0 transition-all lg:hidden"
              style={{
                background: sidebarOpen || activeCount > 0 ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.06)',
                border:     sidebarOpen || activeCount > 0 ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.1)',
                color:      sidebarOpen || activeCount > 0 ? '#A78BFA' : 'rgba(255,255,255,0.65)',
              }}
              aria-expanded={sidebarOpen}
              aria-controls="filter-sidebar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filters
              {activeCount > 0 && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-brand-purple text-white">{activeCount}</span>
              )}
            </button>

            {/* Search */}
            <SearchBar value={filters.q} onChange={(q) => updateFilters({ q, page: 1 })} />

            {/* Sort */}
            <div className="relative shrink-0">
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value as FilterState['sortBy'], page: 1 })}
                className="text-xs rounded-xl px-3.5 py-2.5 appearance-none cursor-pointer pr-8 h-11"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', minWidth: '150px' }}
                aria-label="Sort results"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-fg-3">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="page-container py-6 flex gap-6" ref={resultsRef}>

        {/* ── Desktop sidebar ──────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col w-[264px] shrink-0 rounded-3xl overflow-y-auto self-start sticky top-[116px] max-h-[calc(100dvh-130px)] scrollbar-thin"
          style={sidebarStyle}
          id="filter-sidebar"
        >
          <FilterSidebar
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
            activeCount={activeCount}
          />
        </aside>

        {/* ── Results ──────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* Result count bar */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-fg-2">
              {loading
                ? 'Loading…'
                : `${meta.total.toLocaleString()} business${meta.total !== 1 ? 'es' : ''} found`
              }
            </p>
            {activeCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && <SkeletonGrid count={12} />}

          {/* Error state */}
          {!loading && error && (
            <div className="rounded-3xl p-10 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-red-400 font-semibold mb-2">Failed to load businesses</p>
              <p className="text-red-300 text-sm mb-4">{error}</p>
              <button onClick={() => fetch_(filters)} className="btn-danger text-sm px-5 py-2">Retry</button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && businesses.length === 0 && (
            <div className="rounded-3xl p-14 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-5xl mb-4">🔍</div>
              <p className="font-display font-bold text-xl text-foreground mb-2">No businesses found</p>
              <p className="text-fg-2 text-sm mb-6 max-w-sm mx-auto">
                Try broadening your search — remove some filters or use a different keyword.
              </p>
              <button onClick={resetFilters} className="btn-secondary text-sm px-5 py-2.5">Clear all filters</button>
            </div>
          )}

          {/* Results grid */}
          {!loading && !error && businesses.length > 0 && (
            <motion.div
              key={filtersToParams(filters)}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {businesses.map((b, i) => (
                <motion.div
                  key={b.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                  }}
                >
                  <BusinessCard
                    business={b}
                    currentUserId={currentUserId}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {!loading && !error && (
            <Pagination meta={meta} onChange={changePage} />
          )}
        </main>
      </div>

      {/* ── Mobile sidebar overlay ──────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              style={{ backdropFilter: 'blur(4px)' }}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="sidebar"
              id="filter-sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-[300px] z-50 overflow-hidden flex flex-col lg:hidden"
              style={sidebarStyle}
            >
              <FilterSidebar
                filters={filters}
                onChange={(patch) => { updateFilters(patch); setSidebarOpen(false) }}
                onReset={() => { resetFilters(); setSidebarOpen(false) }}
                activeCount={activeCount}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
