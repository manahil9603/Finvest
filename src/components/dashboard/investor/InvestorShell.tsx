'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatPKR, INDUSTRY_LABELS, PROVINCE_LABELS, timeAgo } from '@/lib/utils'
import { getTrustMeta } from '@/lib/trust'
import { useToast } from '@/hooks/useToast'
import { INDUSTRY_VISUAL } from '@/components/explore/types'
import { PreferencesForm, type InvestorProfileData } from './PreferencesForm'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BusinessCard {
  id: string; title: string; industry: string; city: string; province: string
  listingType: string; stage: string; askingPrice: number | null
  revenue: number | null; highlights: string[]; featured: boolean
  status: string; trustScore: number; isSaved: boolean
  createdAt: string
  owner: { id: string; name: string; role: string; verified: boolean; city: string | null }
}

interface SavedRow {
  savedId: string; note: string | null; savedAt: string
  business: BusinessCard
}

interface ConnectionRow {
  id: string; type: string; status: string; message: string | null
  responseNote: string | null; createdAt: string; updatedAt: string
  business: { id: string; title: string; industry: string; city: string }
  receiver: { id: string; name: string }
}

interface MessageThread {
  id: string; content: string; read: boolean; isMine: boolean
  createdAt: string
  partner: { id: string; name: string; role: string }
}

interface Props {
  user:        { id: string; name: string; city: string | null; verified: boolean }
  profile:     InvestorProfileData | null
  recommended: BusinessCard[]
  saved:       SavedRow[]
  connections: ConnectionRow[]
  messages:    MessageThread[]
  stats: { totalSaved: number; totalConnections: number; pendingCount: number; unreadMessages: number }
}

// ─────────────────────────────────────────────────────────────
// Compact business card for recommendations
// ─────────────────────────────────────────────────────────────

function RecommendCard({ biz, onSaveToggle }: { biz: BusinessCard; onSaveToggle: (id: string, saved: boolean) => void }) {
  const [saved,   setSaved]   = useState(biz.isSaved)
  const [loading, setLoading] = useState(false)
  const visual = INDUSTRY_VISUAL[biz.industry] ?? INDUSTRY_VISUAL.OTHER
  const trust  = getTrustMeta(biz.trustScore)
  const { success, info } = useToast()

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    const method = saved ? 'DELETE' : 'POST'
    const res    = await fetch(`/api/businesses/${biz.id}/save`, { method }).catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setSaved(data.data.saved)
      onSaveToggle(biz.id, data.data.saved)
      if (data.data.saved) success('Saved!', 'Added to your watchlist.')
      else                 info('Removed', 'Removed from watchlist.')
    }
    setLoading(false)
  }

  const TYPE_COLOR: Record<string, string> = { INVESTMENT: '#60A5FA', ACQUISITION: '#A78BFA', PARTNERSHIP: '#FCD34D' }
  const TYPE_LABEL: Record<string, string> = { INVESTMENT: 'Investment', ACQUISITION: 'Acquisition', PARTNERSHIP: 'Partnership' }

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.3)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)')}
    >
      {/* Banner */}
      <div className="h-28 relative flex items-center justify-center" style={{ background: visual.gradient }}>
        <span className="text-4xl">{visual.emoji}</span>

        <div className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
             style={{ background: `${TYPE_COLOR[biz.listingType] ?? '#A78BFA'}20`, color: TYPE_COLOR[biz.listingType] ?? '#A78BFA', border: `1px solid ${TYPE_COLOR[biz.listingType] ?? '#A78BFA'}30` }}>
          {TYPE_LABEL[biz.listingType] ?? biz.listingType}
        </div>

        <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
             style={{ background: trust.bg, color: trust.color }}>
          {trust.icon} {biz.trustScore}
        </div>

        {biz.featured && (
          <div className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
               style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', color: '#fff' }}>
            ⭐
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-display font-bold text-sm text-foreground line-clamp-2 leading-snug mb-1.5 group-hover:text-brand-purple-light transition-colors">
          {biz.title}
        </h4>
        <p className="text-xs text-fg-3 mb-3">
          📍 {biz.city}, {PROVINCE_LABELS[biz.province] ?? biz.province}
          <span className="mx-1 opacity-40">·</span>
          {INDUSTRY_LABELS[biz.industry] ?? biz.industry}
        </p>

        {biz.askingPrice != null && (
          <p className="text-sm font-bold mb-3" style={{ color: '#A78BFA' }}>
            {formatPKR(biz.askingPrice)}
            {biz.revenue != null && (
              <span className="text-xs font-normal ml-2 text-fg-3">
                Rev: {formatPKR(biz.revenue)}
              </span>
            )}
          </p>
        )}

        <div className="mt-auto flex items-center gap-1.5">
          <Link href={`/businesses/${biz.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}>
            View →
          </Link>
          <button onClick={toggleSave} disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={saved
              ? { background: 'rgba(139,92,246,0.18)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
            }
            aria-label={saved ? 'Unsave' : 'Save'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main shell
// ─────────────────────────────────────────────────────────────

const CONN_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Pending',  color: '#FCD34D', bg: 'rgba(245,158,11,0.12)' },
  ACCEPTED: { label: 'Accepted', color: '#34D399', bg: 'rgba(16,185,129,0.12)' },
  REJECTED: { label: 'Declined', color: '#F87171', bg: 'rgba(239,68,68,0.12)'  },
}

export function InvestorShell({ user, profile, recommended: initialRec, saved: initialSaved, connections, messages, stats: initialStats }: Props) {
  const { success, error: showError, info } = useToast()

  const [recommended, setRecommended] = useState<BusinessCard[]>(initialRec)
  const [savedList,   setSavedList]   = useState<SavedRow[]>(initialSaved)
  const [stats,       setStats]       = useState(initialStats)
  const [recLoading,  setRecLoading]  = useState(false)

  // After preferences saved, re-fetch recommendations
  const handleRefresh = useCallback(async (profile: InvestorProfileData) => {
    setRecLoading(true)
    try {
      const params = new URLSearchParams()
      if (profile.preferredIndustries.length) params.set('industries', profile.preferredIndustries.join(','))
      if (profile.preferredProvinces.length)  params.set('provinces',  profile.preferredProvinces.join(','))
      if (profile.minInvestment) params.set('minPrice', String(profile.minInvestment))
      if (profile.maxInvestment) params.set('maxPrice', String(profile.maxInvestment))

      const res  = await fetch(`/api/businesses/recommended?${params}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setRecommended(data.data ?? [])
    } finally {
      setRecLoading(false)
    }
  }, [])

  const handleSaveToggle = useCallback((bizId: string, nowSaved: boolean) => {
    setStats((s) => ({ ...s, totalSaved: nowSaved ? s.totalSaved + 1 : Math.max(0, s.totalSaved - 1) }))
    if (!nowSaved) setSavedList((prev) => prev.filter((row) => row.business.id !== bizId))
  }, [])

  const removeSaved = useCallback(async (savedId: string, bizId: string) => {
    const res = await fetch(`/api/businesses/${bizId}/save`, { method: 'DELETE' })
    if (res.ok) {
      setSavedList((prev) => prev.filter((r) => r.savedId !== savedId))
      setStats((s) => ({ ...s, totalSaved: Math.max(0, s.totalSaved - 1) }))
      info('Removed', 'Removed from your watchlist.')
    } else {
      showError('Error', 'Could not remove from watchlist.')
    }
  }, [info, showError])

  const sectionCard: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.5rem', padding: '1.5rem' }

  return (
    <div className="space-y-8 animate-fade-up">

      {/* ═══ WELCOME ════════════════════════════════ */}
      <section>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-1">Investor Dashboard</p>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
            Welcome back, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-fg-2 text-sm mt-1 flex items-center gap-2 flex-wrap">
            {user.city ?? 'Pakistan'}
            {user.verified && <span className="text-brand-green text-xs font-semibold">✅ Verified</span>}
            {profile?.accredited && <span className="text-brand-blue text-xs font-semibold">🏛 SECP Accredited</span>}
            {profile?.portfolioSize != null && profile.portfolioSize > 0 && (
              <span className="text-fg-3 text-xs">{profile.portfolioSize} portfolio investment{profile.portfolioSize !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Saved Businesses', value: stats.totalSaved,       icon: '🔖', color: '#A78BFA', bg: 'rgba(139,92,246,0.1)'  },
            { label: 'Connections',      value: stats.totalConnections,  icon: '🤝', color: '#34D399', bg: 'rgba(16,185,129,0.1)'  },
            { label: 'Pending',          value: stats.pendingCount,      icon: '⏳', color: '#FCD34D', bg: 'rgba(245,158,11,0.1)'  },
            { label: 'Unread Messages',  value: stats.unreadMessages,    icon: '💬', color: '#60A5FA', bg: 'rgba(59,130,246,0.1)'  },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-3" style={{ background: s.bg }}>{s.icon}</div>
              <div className="font-display font-black text-2xl" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-fg-3 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ MAIN CONTENT (preferences left / content right) ════════ */}
      <div className="flex flex-col xl:flex-row gap-8">

        {/* ── LEFT: Preferences ────────────────────────────────── */}
        <aside className="xl:w-[300px] shrink-0">
          <div className="xl:sticky xl:top-24">
            <h2 className="font-display font-bold text-lg text-foreground mb-4">Investment Preferences</h2>
            <PreferencesForm
              initial={profile}
              onSaved={() => {}}
              onRefresh={handleRefresh}
            />
          </div>
        </aside>

        {/* ── RIGHT: Content ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* ── Recommended Businesses ───────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-lg text-foreground">Recommended for You</h2>
                <p className="text-xs text-fg-3 mt-0.5">
                  {profile?.preferredIndustries.length
                    ? 'Matched to your industry preferences'
                    : 'Set preferences for personalised recommendations'}
                </p>
              </div>
              <Link href="/explore" className="text-xs font-semibold" style={{ color: 'rgba(139,92,246,0.8)' }}>
                Explore all →
              </Link>
            </div>

            {recLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton rounded-3xl h-64" />
                ))}
              </div>
            ) : recommended.length === 0 ? (
              <div className="rounded-3xl p-10 text-center" style={sectionCard}>
                <div className="text-3xl mb-3">🔍</div>
                <p className="text-fg-2 text-sm mb-4">No businesses match your current preferences.</p>
                <p className="text-fg-3 text-xs">Try broadening your industry or province selection.</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
              >
                {recommended.map((biz) => (
                  <motion.div key={biz.id}
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16,1,0.3,1] } } }}>
                    <RecommendCard biz={biz} onSaveToggle={handleSaveToggle} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>

          {/* ── Saved Businesses ─────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground">
                Saved Businesses
                {savedList.length > 0 && (
                  <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                    {savedList.length}
                  </span>
                )}
              </h2>
            </div>

            {savedList.length === 0 ? (
              <div className="rounded-3xl p-8 text-center" style={sectionCard}>
                <div className="text-3xl mb-2">🔖</div>
                <p className="text-fg-2 text-sm">No saved businesses yet.</p>
                <p className="text-fg-3 text-xs mt-1">Use the bookmark icon on any listing to save it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedList.map((row) => {
                  const b    = row.business
                  const visual = INDUSTRY_VISUAL[b.industry] ?? INDUSTRY_VISUAL.OTHER
                  const trust  = getTrustMeta(b.trustScore)
                  return (
                    <div key={row.savedId}
                      className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                           style={{ background: visual.gradient }}>
                        {visual.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/businesses/${b.id}`}
                            className="font-semibold text-sm text-foreground hover:text-brand-purple-light transition-colors truncate">
                            {b.title}
                          </Link>
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: trust.bg, color: trust.color }}>
                            {trust.icon} {b.trustScore}
                          </span>
                        </div>
                        <p className="text-xs text-fg-3 mt-0.5">
                          {INDUSTRY_LABELS[b.industry] ?? b.industry} · {b.city}
                          {b.askingPrice != null && <span className="ml-2 font-medium" style={{ color: '#A78BFA' }}>{formatPKR(b.askingPrice)}</span>}
                        </p>
                        {row.note && <p className="text-[11px] text-fg-3 mt-1 italic">&ldquo;{row.note}&rdquo;</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <time className="text-[11px] text-fg-3 hidden sm:block">{timeAgo(row.savedAt)}</time>
                        <button onClick={() => removeSaved(row.savedId, b.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-fg-3 hover:text-red-400 transition-colors"
                          aria-label="Remove from watchlist">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Connection Requests ───────────────────────────── */}
          <section>
            <h2 className="font-display font-bold text-lg text-foreground mb-4">
              My Connection Requests
              {stats.pendingCount > 0 && (
                <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D' }}>
                  {stats.pendingCount} pending
                </span>
              )}
            </h2>

            {connections.length === 0 ? (
              <div className="rounded-3xl p-8 text-center" style={sectionCard}>
                <div className="text-3xl mb-2">📭</div>
                <p className="text-fg-2 text-sm">No connection requests sent yet.</p>
                <Link href="/explore" className="mt-3 inline-block text-xs font-semibold" style={{ color: 'rgba(139,92,246,0.8)' }}>
                  Browse businesses →
                </Link>
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden" style={{ ...sectionCard, padding: 0 }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['Business', 'Type', 'Status', 'Date'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-fg-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {connections.map((conn) => {
                        const st = CONN_STATUS[conn.status] ?? CONN_STATUS.PENDING
                        return (
                          <tr key={conn.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td className="px-5 py-4">
                              <Link href={`/businesses/${conn.business.id}`}
                                className="text-sm font-semibold text-foreground hover:text-brand-purple-light transition-colors line-clamp-1">
                                {conn.business.title}
                              </Link>
                              <p className="text-xs text-fg-3 mt-0.5">{conn.business.city}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
                                    style={{ background: conn.type === 'INVESTMENT' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)', color: conn.type === 'INVESTMENT' ? '#60A5FA' : '#A78BFA' }}>
                                {conn.type === 'INVESTMENT' ? 'Investment' : 'Acquisition'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                    style={{ background: st.bg, color: st.color }}>
                                {st.label}
                              </span>
                              {conn.status === 'ACCEPTED' && conn.responseNote && (
                                <p className="text-[11px] text-fg-3 mt-1 max-w-[200px] line-clamp-1">&ldquo;{conn.responseNote}&rdquo;</p>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <time className="text-xs text-fg-3 whitespace-nowrap">{timeAgo(conn.createdAt)}</time>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ── Messages Inbox ───────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground">
                Messages
                {stats.unreadMessages > 0 && (
                  <span className="ml-2 w-5 h-5 inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: '#8B5CF6' }}>
                    {stats.unreadMessages}
                  </span>
                )}
              </h2>
              <Link href="/messages" className="text-xs font-semibold" style={{ color: 'rgba(139,92,246,0.8)' }}>
                View all →
              </Link>
            </div>

            {messages.length === 0 ? (
              <div className="rounded-3xl p-8 text-center" style={sectionCard}>
                <div className="text-3xl mb-2">💬</div>
                <p className="text-fg-2 text-sm">No messages yet.</p>
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden" style={{ ...sectionCard, padding: 0 }}>
                {messages.slice(0, 6).map((thread, i) => (
                  <Link key={thread.id} href="/messages"
                    className="flex items-center gap-4 px-5 py-4 hover:bg-surface/5 transition-colors"
                    style={{ borderBottom: i < messages.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                         style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}>
                      {thread.partner.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-${thread.read ? 'normal' : 'semibold'} text-foreground`}>{thread.partner.name}</p>
                      <p className={`text-xs truncate mt-0.5 ${thread.read ? 'text-fg-3' : 'text-fg-2'}`}>
                        {thread.isMine ? 'You: ' : ''}{thread.content}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <time className="text-[10px] text-fg-3">{timeAgo(thread.createdAt)}</time>
                      {!thread.read && !thread.isMine && <span className="w-2 h-2 rounded-full" style={{ background: '#8B5CF6' }} />}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}
