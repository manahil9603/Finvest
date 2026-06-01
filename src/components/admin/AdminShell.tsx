'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { INDUSTRY_LABELS, PROVINCE_LABELS, formatDate, timeAgo } from '@/lib/utils'
import { computeTrustScore, getTrustMeta } from '@/lib/trust'
import { useToast } from '@/hooks/useToast'
import { AdminCharts, type ChartSeries } from './AdminCharts'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface OverviewStats {
  totalUsers:           number
  totalBusinesses:      number
  totalConnections:     number
  pendingVerifications: number
  suspendedUsers:       number
  activeBusinesses:     number
  acceptedConnections:  number
}

interface PendingBusiness {
  id:          string
  title:       string
  industry:    string
  city:        string
  province:    string
  listingType: string
  stage:       string
  status:      string
  askingPrice: number | null
  revenue:     number | null
  profit:      number | null
  highlights:  string[]
  createdAt:   string
  owner: { id: string; name: string; email: string; verified: boolean; phone: string | null; bio: string | null }
}

interface UserRow {
  id:        string
  name:      string
  email:     string
  role:      string
  city:      string | null
  verified:  boolean
  active:    boolean
  createdAt: string
  _count:    { businesses: number; sentConnections: number }
}

interface Props {
  stats:     OverviewStats
  pending:   PendingBusiness[]
  users:     UserRow[]
  userTotal: number
  charts:    ChartSeries
}

// ─────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, bg, sub }: {
  icon: string; label: string; value: number; color: string; bg: string; sub?: string
}) {
  return (
    <div className="rounded-3xl p-5 flex flex-col" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-3" style={{ background: bg }}>{icon}</div>
      <div className="font-display font-black text-2xl mb-0.5" style={{ color }}>{value.toLocaleString()}</div>
      <div className="text-xs text-fg-3">{label}</div>
      {sub && <div className="text-[11px] text-fg-3 mt-0.5">{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Pending approval row
// ─────────────────────────────────────────────────────────────

function PendingRow({
  biz,
  onApprove,
  onReject,
  onVerifyOwner,
}: {
  biz:          PendingBusiness
  onApprove:    (id: string) => Promise<void>
  onReject:     (id: string) => Promise<void>
  onVerifyOwner:(id: string, verify: boolean) => Promise<void>
}) {
  const [loading,        setLoading]        = useState<'approve'|'reject'|'verify'|null>(null)
  const [ownerVerified,  setOwnerVerified]  = useState(biz.owner.verified)

  const trustScore = computeTrustScore({
    askingPrice: biz.askingPrice,
    revenue:     biz.revenue,
    profit:      biz.profit,
    highlights:  biz.highlights,
    owner: { verified: ownerVerified, phone: biz.owner.phone, bio: biz.owner.bio },
  })
  const trust = getTrustMeta(trustScore)

  const handle = async (action: 'approve'|'reject'|'verify', fn: () => Promise<void>) => {
    setLoading(action)
    await fn()
    setLoading(null)
  }

  const TYPE_COLOR: Record<string, string> = { INVESTMENT: '#60A5FA', ACQUISITION: '#A78BFA', PARTNERSHIP: '#FCD34D' }

  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Business */}
      <td className="px-5 py-4">
        <Link href={`/businesses/${biz.id}`}
          className="text-sm font-semibold text-foreground hover:text-brand-purple-light transition-colors line-clamp-1">
          {biz.title}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: `${TYPE_COLOR[biz.listingType]}18`, color: TYPE_COLOR[biz.listingType] ?? '#A78BFA' }}>
            {biz.listingType}
          </span>
          <span className="text-[10px] text-fg-3">{timeAgo(biz.createdAt)}</span>
        </div>
      </td>

      {/* Owner */}
      <td className="px-5 py-4 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
               style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}>
            {biz.owner.name.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{biz.owner.name}</p>
            <p className="text-[11px] text-fg-3">{biz.owner.email}</p>
          </div>
        </div>
      </td>

      {/* Industry + Location */}
      <td className="px-5 py-4 hidden lg:table-cell">
        <p className="text-xs text-fg-2">{INDUSTRY_LABELS[biz.industry] ?? biz.industry}</p>
        <p className="text-[11px] text-fg-3">{biz.city}, {PROVINCE_LABELS[biz.province] ?? biz.province}</p>
      </td>

      {/* Trust Score + Verify toggle */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black" style={{ color: trust.color }}>
            {trust.icon} {trustScore}
          </span>
          <button
            onClick={() => handle('verify', async () => {
              await onVerifyOwner(biz.id, !ownerVerified)
              setOwnerVerified((v) => !v)
            })}
            disabled={!!loading}
            title={ownerVerified ? 'Remove owner verification' : 'Verify owner (+40 trust)'}
            className="text-[11px] px-2 py-0.5 rounded-lg font-semibold transition-all disabled:opacity-40"
            style={ownerVerified
              ? { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
            }
          >
            {loading === 'verify' ? '…' : ownerVerified ? '✅ Verified' : 'Verify'}
          </button>
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handle('approve', () => onApprove(biz.id))}
            disabled={!!loading}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }}>
            {loading === 'approve' ? '…' : '✓ Approve'}
          </button>
          <button
            onClick={() => handle('reject', () => onReject(biz.id))}
            disabled={!!loading}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            {loading === 'reject' ? '…' : '✕ Reject'}
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────
// User row
// ─────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
  ADMIN:          { color: '#A78BFA', bg: 'rgba(139,92,246,0.15)' },
  BUSINESS_OWNER: { color: '#FCD34D', bg: 'rgba(245,158,11,0.12)' },
  INVESTOR:       { color: '#34D399', bg: 'rgba(16,185,129,0.12)' },
  BUYER:          { color: '#60A5FA', bg: 'rgba(59,130,246,0.12)'  },
}

function UserTableRow({
  user,
  onToggleSuspend,
  onDelete,
}: {
  user:            UserRow
  onToggleSuspend: (id: string, active: boolean) => Promise<void>
  onDelete:        (id: string, name: string) => void
}) {
  const [loading,  setLoading]  = useState<'suspend'|null>(null)
  const [active,   setActive]   = useState(user.active)
  const role = ROLE_STYLE[user.role] ?? ROLE_STYLE.BUYER

  const handleSuspend = async () => {
    setLoading('suspend')
    await onToggleSuspend(user.id, !active)
    setActive((a) => !a)
    setLoading(null)
  }

  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* User */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
               style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)', opacity: active ? 1 : 0.4 }}>
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${active ? 'text-foreground' : 'text-fg-3 line-through'}`}>{user.name}</p>
            <p className="text-[11px] text-fg-3 truncate">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-5 py-3.5 hidden sm:table-cell">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: role.bg, color: role.color }}>
          {user.role.replace('_', ' ')}
        </span>
      </td>

      {/* Stats */}
      <td className="px-5 py-3.5 hidden md:table-cell">
        <p className="text-xs text-fg-2">{user._count.businesses} listings</p>
        <p className="text-[11px] text-fg-3">{user._count.sentConnections} connections</p>
      </td>

      {/* Status */}
      <td className="px-5 py-3.5 hidden sm:table-cell">
        <div className="flex items-center gap-1.5">
          {user.verified && <span className="text-brand-green text-xs" title="Verified">✅</span>}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={active
                  ? { background: 'rgba(16,185,129,0.1)', color: '#34D399' }
                  : { background: 'rgba(239,68,68,0.1)', color: '#F87171' }
                }>
            {active ? 'Active' : 'Suspended'}
          </span>
        </div>
        <p className="text-[10px] text-fg-3 mt-0.5">{user.city ?? 'Unknown city'}</p>
      </td>

      {/* Date */}
      <td className="px-5 py-3.5 hidden lg:table-cell">
        <time className="text-xs text-fg-3">{formatDate(user.createdAt)}</time>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSuspend}
            disabled={!!loading}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-40"
            style={active
              ? { background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)' }
              : { background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }
            }
            title={active ? 'Suspend user' : 'Reactivate user'}>
            {loading ? '…' : active ? '⏸ Suspend' : '▶ Activate'}
          </button>
          <button
            onClick={() => onDelete(user.id, user.name)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all text-fg-3 hover:text-red-400 hover:bg-red-500/10"
            title={`Delete ${user.name}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────
// Delete confirm dialog (reusable)
// ─────────────────────────────────────────────────────────────

function ConfirmDialog({
  title, body, confirmLabel, onConfirm, onCancel, loading, danger = true,
}: {
  title: string; body: string; confirmLabel: string
  onConfirm: () => void; onCancel: () => void; loading: boolean; danger?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="w-full max-w-md rounded-3xl p-7"
        style={{ background: 'rgba(20,20,24,0.98)', border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.3)'}`, boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="font-display font-bold text-xl text-foreground mb-2">{title}</h3>
        <p className="text-sm text-fg-2 mb-6 leading-relaxed">{body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: danger ? 'linear-gradient(135deg,#DC2626,#EF4444)' : 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}>
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main shell
// ─────────────────────────────────────────────────────────────

export function AdminShell({ stats, pending: initialPending, users: initialUsers, userTotal, charts }: Props) {
  const { success, error: showError } = useToast()

  const [pending,  setPending]  = useState<PendingBusiness[]>(initialPending)
  const [users,    setUsers]    = useState<UserRow[]>(initialUsers)
  const [overview, setOverview] = useState<OverviewStats>(stats)
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  // ── Pending approval actions ─────────────────────────────────

  const handleApprove = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/verify/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'APPROVE' }),
    })
    const data = await res.json()
    if (!res.ok) { showError('Error', data.error); return }
    setPending((prev) => prev.filter((b) => b.id !== id))
    setOverview((s) => ({ ...s, pendingVerifications: Math.max(0, s.pendingVerifications - 1), activeBusinesses: s.activeBusinesses + 1 }))
    success('Approved!', data.message)
  }, [success, showError])

  const handleReject = useCallback(async (id: string) => {
    const res  = await fetch(`/api/admin/verify/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'REJECT' }),
    })
    const data = await res.json()
    if (!res.ok) { showError('Error', data.error); return }
    setPending((prev) => prev.filter((b) => b.id !== id))
    setOverview((s) => ({ ...s, pendingVerifications: Math.max(0, s.pendingVerifications - 1) }))
    success('Rejected', data.message)
  }, [success, showError])

  const handleVerifyOwner = useCallback(async (businessId: string, verify: boolean) => {
    const res  = await fetch(`/api/admin/trust/${businessId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ verifyOwner: verify }),
    })
    const data = await res.json()
    if (!res.ok) showError('Error', data.error)
    else         success(verify ? 'Owner verified' : 'Verification removed', data.message)
  }, [success, showError])

  // ── User search ──────────────────────────────────────────────

  const searchUsers = useCallback(async (q: string, role: string) => {
    setSearchLoading(true)
    const params = new URLSearchParams()
    if (q)    params.set('q', q)
    if (role) params.set('role', role)
    const res  = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    if (res.ok) setUsers(data.data ?? [])
    setSearchLoading(false)
  }, [])

  const handleSearchChange = (q: string) => {
    setUserSearch(q)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => searchUsers(q, roleFilter), 350)
  }

  const handleRoleChange = (role: string) => {
    setRoleFilter(role)
    searchUsers(userSearch, role)
  }

  // ── User actions ─────────────────────────────────────────────

  const handleSuspend = useCallback(async (id: string, active: boolean) => {
    const res  = await fetch(`/api/admin/users/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ active }),
    })
    const data = await res.json()
    if (!res.ok) showError('Error', data.error)
    else {
      success(active ? 'User reactivated' : 'User suspended', data.message)
      setOverview((s) => ({ ...s, suspendedUsers: active ? Math.max(0, s.suspendedUsers - 1) : s.suspendedUsers + 1 }))
    }
  }, [success, showError])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const res  = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { showError('Error', data.error) }
    else {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setOverview((s) => ({ ...s, totalUsers: Math.max(0, s.totalUsers - 1) }))
      success('Deleted', data.message)
    }
    setDeleteLoading(false)
    setDeleteTarget(null)
  }, [deleteTarget, success, showError])

  const sectionCard: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.5rem', padding: 0, overflow: 'hidden' }
  const TH = (h: string, cls = '') => (
    <th key={h} className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-fg-3 ${cls}`}>{h}</th>
  )

  return (
    <>
      <div className="space-y-8 animate-fade-up">

        {/* ═══ HEADER ═══════════════════════════════════════════ */}
        <section>
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}>
                  <span className="text-lg">⚙️</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-fg-3">Platform Admin</p>
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">Control Centre</h1>
                </div>
              </div>
              <Link
                href="/admin/jobs"
                className="text-sm font-semibold text-brand-purple-light hover:underline whitespace-nowrap"
              >
                Manage careers →
              </Link>
            </div>
          </div>

          {/* ── Stat cards ───────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon="👤" label="Total Users"           value={overview.totalUsers}           color="#A78BFA" bg="rgba(139,92,246,0.1)" sub={`${overview.suspendedUsers} suspended`} />
            <StatCard icon="🏢" label="Total Businesses"      value={overview.totalBusinesses}      color="#34D399" bg="rgba(16,185,129,0.1)"  sub={`${overview.activeBusinesses} active`} />
            <StatCard icon="🤝" label="Total Connections"     value={overview.totalConnections}     color="#60A5FA" bg="rgba(59,130,246,0.1)"  sub={`${overview.acceptedConnections} accepted`} />
            <StatCard icon="⏳" label="Pending Verifications" value={overview.pendingVerifications} color="#FCD34D" bg="rgba(245,158,11,0.1)"  sub="awaiting review" />
          </div>

          {/* ── Charts ──────────────────────────────────── */}
          <AdminCharts
            series={charts}
            totals={{ users: overview.totalUsers, businesses: overview.totalBusinesses, connections: overview.totalConnections }}
          />
        </section>

        {/* ═══ PENDING APPROVALS ════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">Pending Verifications</h2>
              <p className="text-xs text-fg-3 mt-0.5">DRAFT businesses awaiting admin review</p>
            </div>
            {overview.pendingVerifications > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D' }}>
                {overview.pendingVerifications} pending
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="text-3xl mb-2">✅</div>
              <p className="text-fg-2 text-sm font-semibold">All caught up!</p>
              <p className="text-fg-3 text-xs mt-1">No businesses pending review.</p>
            </div>
          ) : (
            <div style={sectionCard}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {TH('Business')}
                      {TH('Owner', 'hidden md:table-cell')}
                      {TH('Industry / Location', 'hidden lg:table-cell')}
                      {TH('Trust Score')}
                      {TH('Actions')}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((biz) => (
                      <PendingRow key={biz.id} biz={biz}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onVerifyOwner={handleVerifyOwner} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ═══ ALL USERS ════════════════════════════════════════ */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex-1">
              <h2 className="font-display font-bold text-lg text-foreground">All Users</h2>
              <p className="text-xs text-fg-3 mt-0.5">{userTotal.toLocaleString()} total accounts</p>
            </div>
            {/* Search + role filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className="input pl-9 pr-3 h-9 text-sm w-52"
                  placeholder="Search name or email…"
                  value={userSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <select
                className="input h-9 text-sm appearance-none w-36"
                value={roleFilter}
                onChange={(e) => handleRoleChange(e.target.value)}>
                <option value="">All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="BUSINESS_OWNER">Business Owner</option>
                <option value="INVESTOR">Investor</option>
                <option value="BUYER">Buyer</option>
              </select>
            </div>
          </div>

          <div style={sectionCard}>
            {searchLoading ? (
              <div className="p-8 text-center">
                <svg className="animate-spin w-6 h-6 mx-auto text-brand-purple" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-fg-3 text-sm">No users found for that query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {TH('User')}
                      {TH('Role', 'hidden sm:table-cell')}
                      {TH('Activity', 'hidden md:table-cell')}
                      {TH('Status', 'hidden sm:table-cell')}
                      {TH('Joined', 'hidden lg:table-cell')}
                      {TH('Actions')}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <UserTableRow key={u.id} user={u}
                        onToggleSuspend={handleSuspend}
                        onDelete={(id, name) => setDeleteTarget({ id, name })} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ═══ REPORTED CONTENT (placeholder) ════════════════════ */}
        <section>
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Reported Content</h2>
          <div
            className="rounded-3xl p-10 text-center"
            style={{ background: 'rgba(245,158,11,0.05)', border: '1.5px dashed rgba(245,158,11,0.2)' }}
          >
            <div className="text-4xl mb-3">🚩</div>
            <p className="font-semibold text-foreground mb-1">Reporting system coming soon</p>
            <p className="text-xs text-fg-3 max-w-sm mx-auto">
              Users will be able to flag misleading listings, fraudulent profiles, and abusive messages.
              Reports will appear in this queue for admin review.
            </p>
          </div>
        </section>

      </div>

      {/* ─── Delete confirm dialog ─────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDialog
            title="Delete account permanently?"
            body={`You are about to permanently delete "${deleteTarget.name}" and ALL their associated data: businesses, connections, messages, and saved items. This cannot be undone.`}
            confirmLabel="Yes, delete permanently"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>
    </>
  )
}
