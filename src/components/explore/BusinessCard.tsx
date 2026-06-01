'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatPKR, INDUSTRY_LABELS, PROVINCE_LABELS, timeAgo } from '@/lib/utils'
import { getTrustMeta } from '@/lib/trust'
import { useToast } from '@/hooks/useToast'
import { INDUSTRY_VISUAL } from './types'
import type { BusinessResult } from './types'

// ── Trust badge ───────────────────────────────────────────────────────────────

function TrustBadge({ score }: { score: number }) {
  const { label, color, bg, icon } = getTrustMeta(score)
  return (
    <div
      className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
      style={{ background: bg, color, border: `1px solid ${color}30` }}
      title={`Trust score: ${score}/100 — ${label}`}
    >
      <span>{icon}</span>
      <span>{score}</span>
    </div>
  )
}

// ── Save button ───────────────────────────────────────────────────────────────

function SaveButton({
  businessId,
  isSaved:  initialSaved,
  disabled: isOwn,
}: {
  businessId: string
  isSaved:    boolean
  disabled:   boolean
}) {
  const [saved,   setSaved]   = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { success, info, error } = useToast()

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOwn) return

    setLoading(true)
    try {
      const method = saved ? 'DELETE' : 'POST'
      const res  = await fetch(`/api/users/save/${businessId}`, { method })
      if (res.status === 401) {
        info('Sign in required', 'Create a free account to save businesses.')
        router.push('/login')
        return
      }
      const data = await res.json()
      if (!res.ok) { error('Error', data.error); return }
      setSaved(data.data.saved)
      if (data.data.saved) success('Saved!', 'Business added to your watchlist.')
      else                 info('Removed', 'Business removed from your watchlist.')
    } catch {
      error('Network error', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isOwn) return null

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remove from saved' : 'Save business'}
      title={saved ? 'Remove from saved' : 'Save business'}
      className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 shrink-0 disabled:opacity-50"
      style={
        saved
          ? { background: 'rgba(139,92,246,0.18)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }
          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
      }
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}

// ── Type / stage pill ─────────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  INVESTMENT:  { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
  ACQUISITION: { bg: 'rgba(139,92,246,0.12)',  color: '#A78BFA', border: 'rgba(139,92,246,0.25)' },
  PARTNERSHIP: { bg: 'rgba(245,158,11,0.12)',  color: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
}

const STAGE_STYLES: Record<string, { bg: string; color: string }> = {
  IDEA:      { bg: 'rgba(113,113,122,0.15)', color: '#A1A1AA' },
  STARTUP:   { bg: 'rgba(14,165,233,0.12)',  color: '#38BDF8' },
  GROWING:   { bg: 'rgba(16,185,129,0.12)',  color: '#34D399' },
  EXPANDING: { bg: 'rgba(139,92,246,0.12)',  color: '#A78BFA' },
  MATURE:    { bg: 'rgba(249,115,22,0.12)',  color: '#FB923C' },
}

const STAGE_LABELS: Record<string, string> = {
  IDEA: 'Idea', STARTUP: 'Startup', GROWING: 'Growing', EXPANDING: 'Expanding', MATURE: 'Mature',
}

const TYPE_LABELS: Record<string, string> = {
  INVESTMENT: 'Investment', ACQUISITION: 'Acquisition', PARTNERSHIP: 'Partnership',
}

// ── Main Card ─────────────────────────────────────────────────────────────────

interface BusinessCardProps {
  business:    BusinessResult
  currentUserId?: string | null
  className?:  string
}

export function BusinessCard({ business: b, currentUserId, className = '' }: BusinessCardProps) {
  const visual    = INDUSTRY_VISUAL[b.industry] ?? INDUSTRY_VISUAL.OTHER
  const typeStyle = TYPE_STYLES[b.listingType]  ?? TYPE_STYLES.INVESTMENT
  const stageStyle= STAGE_STYLES[b.stage]       ?? STAGE_STYLES.IDEA
  const isOwn     = !!currentUserId && currentUserId === b.ownerId

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border:     '1px solid rgba(255,255,255,0.09)',
        boxShadow:  '0 4px 24px rgba(0,0,0,0.25)',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.35)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow   = '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.15)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.09)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow   = '0 4px 24px rgba(0,0,0,0.25)'
      }}
    >
      {/* ── Banner / image ────────────────────────────────── */}
      <div className="relative h-36 shrink-0 overflow-hidden" style={{ background: visual.gradient }}>
        {b.imageUrls.length > 0 ? (
          <Image
            src={b.imageUrls[0]}
            alt={b.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          /* Gradient placeholder with industry emoji */
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}
            >
              {visual.emoji}
            </div>
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Verified badge — top left */}
        {b.owner.verified && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
            style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399', border: '1px solid rgba(16,185,129,0.35)', backdropFilter: 'blur(8px)' }}
          >
            ✅ Verified
          </div>
        )}

        {/* Trust score — top right */}
        <div className="absolute top-3 right-3">
          <TrustBadge score={b.trustScore} />
        </div>

        {/* Featured ribbon */}
        {b.featured && (
          <div
            className="absolute bottom-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)', color: '#fff' }}
          >
            ⭐ Featured
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-5">
        {/* Type + stage badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }}
          >
            {TYPE_LABELS[b.listingType] ?? b.listingType}
          </span>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: stageStyle.bg, color: stageStyle.color }}
          >
            {STAGE_LABELS[b.stage] ?? b.stage}
          </span>
        </div>

        {/* Title */}
        <h3
          className="font-display font-bold text-foreground leading-snug mb-1.5 line-clamp-2 transition-colors duration-200 group-hover:text-brand-purple-light"
          style={{ fontSize: '0.975rem' }}
        >
          {b.title}
        </h3>

        {/* Location */}
        <p className="text-xs text-fg-3 mb-4 flex items-center gap-1">
          <span>📍</span>
          <span>{b.city},&nbsp;{PROVINCE_LABELS[b.province] ?? b.province}</span>
          <span className="mx-1 opacity-40">·</span>
          <span>{INDUSTRY_LABELS[b.industry] ?? b.industry}</span>
        </p>

        {/* Financial cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {b.askingPrice != null ? (
            <div className="rounded-2xl p-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-fg-3 mb-0.5">Funding Reqd.</p>
              <p className="font-bold text-sm" style={{ color: '#A78BFA' }}>
                {formatPKR(b.askingPrice)}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-fg-3 mb-0.5">Funding Reqd.</p>
              <p className="text-sm text-fg-3 italic">Not disclosed</p>
            </div>
          )}

          {b.revenue != null ? (
            <div className="rounded-2xl p-3" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-fg-3 mb-0.5">Ann. Revenue</p>
              <p className="font-bold text-sm" style={{ color: '#34D399' }}>
                {formatPKR(b.revenue)}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-fg-3 mb-0.5">Ann. Revenue</p>
              <p className="text-sm text-fg-3 italic">Not disclosed</p>
            </div>
          )}
        </div>

        {/* Highlights */}
        {b.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {b.highlights.slice(0, 3).map((h) => (
              <span
                key={h}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                ✓ {h}
              </span>
            ))}
          </div>
        )}

        {/* Footer ─ owner + actions */}
        <div
          className="mt-auto pt-3 flex items-center justify-between gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Owner */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs font-black text-white"
              style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}
              aria-hidden="true"
            >
              {b.owner.name.charAt(0)}
            </div>
            <span className="text-xs text-fg-2 truncate">
              {b.owner.name}
              {b.owner.verified && <span className="ml-1 text-brand-green text-[10px]">✅</span>}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <SaveButton businessId={b.id} isSaved={b.isSaved} disabled={isOwn} />

            <Link
              href={`/businesses/${b.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}
            >
              View
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
