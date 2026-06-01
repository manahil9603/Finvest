'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPKR, INDUSTRY_LABELS, PROVINCE_LABELS, timeAgo } from '@/lib/utils'
import { computeTrustScore } from '@/lib/trust'
import { getTrustMeta } from '@/lib/trust'
import { useToast } from '@/hooks/useToast'
import { AnalyticsChart, type ChartDay } from './AnalyticsChart'
import { BusinessFormPanel, type BusinessDraft } from './BusinessFormPanel'
import { INDUSTRY_VISUAL } from '@/components/explore/types'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ConnectionRow {
  id:           string
  type:         string
  status:       string
  message:      string | null
  responseNote: string | null
  createdAt:    string
  updatedAt:    string
  sender: { id: string; name: string; role: string; verified: boolean }
  business: { id: string; title: string; industry: string; city: string }
}

interface MessageRow {
  id:         string
  content:    string
  senderId:   string
  read:       boolean
  createdAt:  string
  sender:     { id: string; name: string }
}

interface DashboardShellProps {
  user:        { id: string; name: string; city: string | null; verified: boolean }
  businesses:  BusinessDraft[]
  connections: ConnectionRow[]
  messages:    MessageRow[]
  chartData:   ChartDay[]
  stats: {
    totalBusinesses:  number
    totalConnections: number
    pendingCount:     number
    unreadMessages:   number
  }
}

// ─────────────────────────────────────────────────────────────
// Business row card
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Active',  color: '#34D399', bg: 'rgba(16,185,129,0.12)'  },
  DRAFT:  { label: 'Draft',   color: '#A1A1AA', bg: 'rgba(113,113,122,0.12)' },
  CLOSED: { label: 'Closed',  color: '#F87171', bg: 'rgba(239,68,68,0.12)'   },
}

function BusinessRow({
  biz,
  onEdit,
  onDelete,
  onBoost,
}: {
  biz:      BusinessDraft
  onEdit:   (b: BusinessDraft) => void
  onDelete: (b: BusinessDraft) => void
  onBoost:  (b: BusinessDraft) => Promise<void>
}) {
  const [boostLoading, setBoostLoading] = useState(false)
  const visual    = INDUSTRY_VISUAL[biz.industry] ?? INDUSTRY_VISUAL.OTHER
  const statusCfg = STATUS_CONFIG[biz.status] ?? STATUS_CONFIG.DRAFT
  const trust     = getTrustMeta(computeTrustScore(biz))

  const handleBoost = async () => {
    setBoostLoading(true)
    await onBoost(biz)
    setBoostLoading(false)
  }

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl transition-all panel-elevated"
    >
      {/* Industry thumbnail */}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
           style={{ background: visual.gradient }}>
        {visual.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Link href={`/businesses/${biz.id}`}
            className="font-semibold text-foreground hover:text-brand-purple-light transition-colors truncate text-sm">
            {biz.title}
          </Link>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
          {biz.featured && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', color: '#fff' }}>
              ⭐ Boosted
            </span>
          )}
        </div>
        <p className="text-xs text-fg-3">
          {INDUSTRY_LABELS[biz.industry] ?? biz.industry} ·
          {PROVINCE_LABELS[biz.province] ?? biz.province}, {biz.city} ·
          Trust <span style={{ color: trust.color }}>{trust.icon} {computeTrustScore(biz)}/100</span>
        </p>
        {biz.askingPrice != null && (
          <p className="text-xs mt-1" style={{ color: '#A78BFA' }}>
            Asking: {formatPKR(biz.askingPrice)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Analytics placeholder */}
        <button disabled title="Analytics coming soon"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium opacity-40 cursor-not-allowed"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
          📊 Analytics
        </button>

        {/* Boost */}
        <button onClick={handleBoost} disabled={boostLoading || biz.status !== 'ACTIVE'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
          style={
            biz.featured
              ? { background: 'rgba(139,92,246,0.18)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
          }
          title={biz.status !== 'ACTIVE' ? 'Only active listings can be boosted' : biz.featured ? 'Remove boost' : 'Boost this listing'}>
          {boostLoading ? '…' : biz.featured ? '⚡ Boosted' : '⚡ Boost'}
        </button>

        {/* Edit */}
        <button onClick={() => onEdit(biz)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' }}>
          ✏️ Edit
        </button>

        {/* Delete */}
        <button onClick={() => onDelete(biz)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}
          title="Delete listing">
          🗑
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Delete confirm dialog
// ─────────────────────────────────────────────────────────────

function DeleteDialog({
  business, onConfirm, onCancel, loading,
}: {
  business: BusinessDraft
  onConfirm: () => void
  onCancel:  () => void
  loading:   boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="w-full max-w-md rounded-3xl p-7"
        style={{ background: 'rgba(20,20,24,0.98)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-4">🗑️</div>
        <h3 className="font-display font-bold text-xl text-foreground mb-2">Delete listing?</h3>
        <p className="text-sm text-fg-2 mb-1">
          You&apos;re about to permanently delete:
        </p>
        <p className="font-semibold text-foreground mb-4">&ldquo;{business.title}&rdquo;</p>
        <p className="text-xs text-fg-3 mb-6">
          This will also remove all connection requests and saved entries for this listing. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#DC2626,#EF4444)' }}>
            {loading ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Connection request row
// ─────────────────────────────────────────────────────────────

function ConnectionRow({
  conn,
  onAccept,
  onReject,
}: {
  conn:     ConnectionRow
  onAccept: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
}) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const [status,  setStatus]  = useState(conn.status)

  const handle = async (action: 'accept' | 'reject') => {
    setLoading(action)
    if (action === 'accept') await onAccept(conn.id)
    else                     await onReject(conn.id)
    setStatus(action === 'accept' ? 'ACCEPTED' : 'REJECTED')
    setLoading(null)
  }

  const STATUS_PILL: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:  { label: 'Pending',  color: '#FCD34D', bg: 'rgba(245,158,11,0.12)'  },
    ACCEPTED: { label: 'Accepted', color: '#34D399', bg: 'rgba(16,185,129,0.12)'  },
    REJECTED: { label: 'Rejected', color: '#F87171', bg: 'rgba(239,68,68,0.12)'   },
  }
  const pill = STATUS_PILL[status] ?? STATUS_PILL.PENDING

  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Sender */}
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
               style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}>
            {conn.sender.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{conn.sender.name}</p>
            <p className="text-[11px] text-fg-3">{conn.sender.role.replace('_', ' ')}</p>
          </div>
        </div>
      </td>

      {/* Business */}
      <td className="py-3.5 pr-4 hidden md:table-cell">
        <p className="text-xs text-fg-2 truncate max-w-[160px]">{conn.business.title}</p>
      </td>

      {/* Type */}
      <td className="py-3.5 pr-4 hidden sm:table-cell">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: conn.type === 'INVESTMENT' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)',
                       color: conn.type === 'INVESTMENT' ? '#60A5FA' : '#A78BFA' }}>
          {conn.type === 'INVESTMENT' ? 'Investment' : 'Acquisition'}
        </span>
      </td>

      {/* Message */}
      <td className="py-3.5 pr-4 hidden lg:table-cell">
        <p className="text-xs text-fg-3 line-clamp-1 max-w-[200px]">{conn.message ?? '—'}</p>
      </td>

      {/* Date */}
      <td className="py-3.5 pr-4 hidden sm:table-cell">
        <time className="text-xs text-fg-3 whitespace-nowrap">{timeAgo(conn.createdAt)}</time>
      </td>

      {/* Status / Actions */}
      <td className="py-3.5">
        {status === 'PENDING' ? (
          <div className="flex items-center gap-1.5">
            <button onClick={() => handle('accept')} disabled={!!loading}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }}>
              {loading === 'accept' ? '…' : '✓ Accept'}
            </button>
            <button onClick={() => handle('reject')} disabled={!!loading}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              {loading === 'reject' ? '…' : '✕'}
            </button>
          </div>
        ) : (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: pill.bg, color: pill.color }}>
            {pill.label}
          </span>
        )}
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────
// Main shell
// ─────────────────────────────────────────────────────────────

export function DashboardShell({
  user, businesses: initial, connections: initialConn, messages,
  chartData, stats: initialStats,
}: DashboardShellProps) {
  const { success, error: showError } = useToast()

  const [businesses,  setBusinesses]  = useState<BusinessDraft[]>(initial)
  const [connections, setConnections] = useState<ConnectionRow[]>(initialConn)
  const [stats,       setStats]       = useState(initialStats)

  const [formOpen,    setFormOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState<BusinessDraft | null>(null)
  const [deleteTarget,setDeleteTarget]= useState<BusinessDraft | null>(null)
  const [deleteLoad,  setDeleteLoad]  = useState(false)

  // ── Business CRUD ──────────────────────────────────────────

  const handleSaved = useCallback((biz: BusinessDraft, isNew: boolean) => {
    if (isNew) {
      setBusinesses((prev) => [
        {
          ...biz,
          owner: biz.owner ?? { verified: user.verified, phone: null, bio: null },
        },
        ...prev,
      ])
      setStats((s) => ({ ...s, totalBusinesses: s.totalBusinesses + 1 }))
    } else {
      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === biz.id ? { ...biz, owner: biz.owner ?? b.owner } : b,
        ),
      )
    }
  }, [user.verified])

  const handleBoost = useCallback(async (biz: BusinessDraft) => {
    try {
      const res  = await fetch(`/api/businesses/${biz.id}/boost`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { showError('Error', data.error); return }
      setBusinesses((prev) => prev.map((b) => b.id === biz.id ? { ...b, featured: data.data.featured } : b))
      success(data.message)
    } catch {
      showError('Network error', 'Please try again.')
    }
  }, [success, showError])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteLoad(true)
    try {
      const res  = await fetch(`/api/businesses/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { showError('Error', data.error); return }
      setBusinesses((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      setStats((s) => ({ ...s, totalBusinesses: s.totalBusinesses - 1 }))
      setDeleteTarget(null)
      success('Deleted', 'Listing removed successfully.')
    } catch {
      showError('Network error', 'Please try again.')
    } finally {
      setDeleteLoad(false)
    }
  }, [deleteTarget, success, showError])

  // ── Connection actions ─────────────────────────────────────

  const handleConnectionAction = useCallback(async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const res  = await fetch(`/api/connections/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) { showError('Error', data.error); return }
      setConnections((prev) => prev.map((c) => c.id === id ? { ...c, status } : c))
      if (status === 'ACCEPTED') {
        setStats((s) => ({ ...s, totalConnections: s.totalConnections + 1, pendingCount: Math.max(0, s.pendingCount - 1) }))
        success('Connected!', data.message)
      } else {
        setStats((s) => ({ ...s, pendingCount: Math.max(0, s.pendingCount - 1) }))
      }
    } catch {
      showError('Network error', 'Please try again.')
    }
  }, [success, showError])

  const totalConnReqs = chartData.reduce((s, d) => s + d.count, 0)

  return (
    <>
      <div className="space-y-8 animate-fade-up">

        {/* ═══════════════ WELCOME HEADER ═══════════════ */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-1">Business Owner Dashboard</p>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
                Good to see you, {(user.name?.trim() ?? 'there').split(/\s+/)[0]} 👋
              </h1>
              <p className="text-fg-2 text-sm mt-1">
                {user.city ?? 'Pakistan'}
                {user.verified && <span className="ml-2 text-brand-green text-xs font-semibold">✅ Verified</span>}
              </p>
            </div>
            <button
              onClick={() => { setEditTarget(null); setFormOpen(true) }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 shrink-0"
              style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', boxShadow: '0 4px 15px rgba(107,33,168,0.4)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              List New Business
            </button>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'My Listings',        value: stats.totalBusinesses,  icon: '📋', color: '#A78BFA', bg: 'rgba(139,92,246,0.1)' },
              { label: 'Total Connections',   value: stats.totalConnections, icon: '🤝', color: '#34D399', bg: 'rgba(16,185,129,0.1)' },
              { label: 'Pending Requests',    value: stats.pendingCount,     icon: '⏳', color: '#FCD34D', bg: 'rgba(245,158,11,0.1)'  },
              { label: 'Unread Messages',     value: stats.unreadMessages,   icon: '💬', color: '#60A5FA', bg: 'rgba(59,130,246,0.1)'  },
            ].map((s) => (
              <div key={s.label} className="rounded-3xl p-5 flex flex-col panel-elevated">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg mb-3"
                     style={{ background: s.bg }}>{s.icon}</div>
                <div className="font-display font-black text-2xl" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-fg-3 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ MY BUSINESSES ═══════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">My Listings</h2>
            <button onClick={() => { setEditTarget(null); setFormOpen(true) }}
              className="text-xs font-semibold transition-colors" style={{ color: 'rgba(139,92,246,0.8)' }}>
              + Add new →
            </button>
          </div>

          {businesses.length === 0 ? (
            <div className="rounded-3xl p-12 text-center panel-elevated">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-fg-2 mb-4">You haven&apos;t listed a business yet.</p>
              <button onClick={() => { setEditTarget(null); setFormOpen(true) }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}>
                Create your first listing
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {businesses.map((biz) => (
                <BusinessRow
                  key={biz.id}
                  biz={biz}
                  onEdit={(b) => { setEditTarget(b); setFormOpen(true) }}
                  onDelete={setDeleteTarget}
                  onBoost={handleBoost}
                />
              ))}
            </div>
          )}
        </section>

        {/* ═══════════════ CONNECTION REQUESTS ═══════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">
              Connection Requests
              {stats.pendingCount > 0 && (
                <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D' }}>
                  {stats.pendingCount} pending
                </span>
              )}
            </h2>
          </div>

          {connections.length === 0 ? (
            <div className="rounded-3xl p-10 text-center panel-elevated">
              <div className="text-3xl mb-3">📭</div>
              <p className="text-fg-2 text-sm">No connection requests yet. They&apos;ll appear here when investors reach out.</p>
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden panel-elevated p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['From', 'Listing', 'Type', 'Message', 'Date', 'Action'].map((h) => (
                        <th key={h}
                          className={`px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-fg-3 ${
                            h === 'Listing' ? 'hidden md:table-cell' :
                            h === 'Type'    ? 'hidden sm:table-cell' :
                            h === 'Message' ? 'hidden lg:table-cell' :
                            h === 'Date'    ? 'hidden sm:table-cell' : ''
                          }`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[&>tr:last-child]:border-0">
                    {connections.map((conn) => (
                      <tr key={conn.id} className="px-5">
                        <td colSpan={6} className="p-0">
                          <table className="w-full">
                            <tbody>
                              <ConnectionRow
                                conn={conn}
                                onAccept={(id) => handleConnectionAction(id, 'ACCEPTED')}
                                onReject={(id) => handleConnectionAction(id, 'REJECTED')}
                              />
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ═══════════════ BOTTOM ROW (messages + chart) ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Messages */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground">Recent Messages</h2>
              <Link href="/messages" className="text-xs font-semibold" style={{ color: 'rgba(139,92,246,0.8)' }}>
                View all →
              </Link>
            </div>
            <div className="rounded-3xl overflow-hidden panel-elevated p-0">
              {messages.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-fg-3 text-sm">No messages yet.</p>
                </div>
              ) : (
                messages.slice(0, 5).map((msg) => (
                  <Link key={msg.id} href="/messages"
                    className="flex items-center gap-3 px-5 py-4 hover:bg-surface/5 transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                         style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}>
                      {msg.sender.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${msg.read ? 'text-fg-2' : 'text-foreground font-semibold'}`}>
                        {msg.sender.name}
                      </p>
                      <p className="text-xs text-fg-3 truncate">{msg.content}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <time className="text-[10px] text-fg-3">{timeAgo(msg.createdAt)}</time>
                      {!msg.read && <span className="w-2 h-2 rounded-full bg-brand-purple" />}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Analytics Chart */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground">Analytics Snapshot</h2>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>
                Last 7 days
              </span>
            </div>
            <div className="rounded-3xl p-6 panel-elevated">
              <AnalyticsChart data={chartData} total={totalConnReqs} />
            </div>
          </section>
        </div>
      </div>

      {/* ─── Business form slide-over ─────────────────────── */}
      <BusinessFormPanel
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSaved={handleSaved}
        editing={editTarget}
      />

      {/* ─── Delete confirm dialog ────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteDialog
            business={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleteLoad}
          />
        )}
      </AnimatePresence>
    </>
  )
}
