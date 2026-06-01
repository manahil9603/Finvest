import Link from 'next/link'
import { formatPKR, INDUSTRY_LABELS, PROVINCE_LABELS, timeAgo } from '@/lib/utils'
import { getTrustMeta } from '@/lib/trust'
import { INDUSTRY_VISUAL } from '@/components/explore/types'
import { computeTrustScore } from '@/lib/trust'

// Inline card type (avoids pulling in the full BusinessResult)
interface SimilarBiz {
  id:          string
  title:       string
  industry:    string
  city:        string
  province:    string
  listingType: string
  stage:       string
  askingPrice: number | null
  revenue:     number | null
  profit:      number | null
  highlights:  string[]
  featured:    boolean
  createdAt:   string
  owner:       { name: string; verified: boolean; phone: string | null; bio: string | null }
}

function MiniCard({ biz }: { biz: SimilarBiz }) {
  const visual     = INDUSTRY_VISUAL[biz.industry]  ?? INDUSTRY_VISUAL.OTHER
  const trustScore = computeTrustScore(biz)
  const trust      = getTrustMeta(trustScore)

  const TYPE_COLOR: Record<string, string> = {
    INVESTMENT:  '#60A5FA',
    ACQUISITION: '#A78BFA',
    PARTNERSHIP: '#FCD34D',
  }
  const TYPE_LABEL: Record<string, string> = {
    INVESTMENT: 'Investment', ACQUISITION: 'Acquisition', PARTNERSHIP: 'Partnership',
  }

  return (
    <Link
      href={`/businesses/${biz.id}`}
      className="panel-elevated group flex flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/35"
    >
      {/* Compact banner */}
      <div
        className="h-24 relative flex items-center justify-center"
        style={{ background: visual.gradient }}
      >
        <span className="text-3xl">{visual.emoji}</span>
        {/* Trust badge */}
        <div
          className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: trust.bg, color: trust.color }}
        >
          {trust.icon} {trustScore}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Type chip */}
        <span
          className="self-start text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2"
          style={{ color: TYPE_COLOR[biz.listingType] ?? '#A78BFA', background: `${TYPE_COLOR[biz.listingType] ?? '#A78BFA'}18` }}
        >
          {TYPE_LABEL[biz.listingType] ?? biz.listingType}
        </span>

        {/* Title */}
        <h4 className="font-display font-bold text-sm text-foreground line-clamp-2 leading-snug mb-1.5 group-hover:text-brand-purple-light transition-colors">
          {biz.title}
        </h4>

        {/* Location */}
        <p className="text-xs text-fg-3 mb-3">
          📍 {biz.city}, {PROVINCE_LABELS[biz.province] ?? biz.province}
          <span className="mx-1 opacity-40">·</span>
          {INDUSTRY_LABELS[biz.industry] ?? biz.industry}
        </p>

        {/* Financials */}
        {(biz.askingPrice || biz.revenue) && (
          <div className="grid grid-cols-2 gap-2 mt-auto">
            {biz.askingPrice != null && (
              <div className="rounded-xl p-2" style={{ background: 'rgba(139,92,246,0.08)' }}>
                <p className="text-[9px] text-fg-3 font-semibold uppercase tracking-wide">Asking</p>
                <p className="text-xs font-bold" style={{ color: '#A78BFA' }}>{formatPKR(biz.askingPrice)}</p>
              </div>
            )}
            {biz.revenue != null && (
              <div className="rounded-xl p-2" style={{ background: 'rgba(16,185,129,0.07)' }}>
                <p className="text-[9px] text-fg-3 font-semibold uppercase tracking-wide">Revenue</p>
                <p className="text-xs font-bold" style={{ color: '#34D399' }}>{formatPKR(biz.revenue)}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-3 pt-3 text-xs text-fg-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="flex items-center gap-1">
            {biz.owner.verified && <span>✅</span>}
            <span className="truncate">{biz.owner.name}</span>
          </span>
          <time>{timeAgo(biz.createdAt)}</time>
        </div>
      </div>
    </Link>
  )
}

interface SimilarBusinessesProps {
  businesses: SimilarBiz[]
  currentId:  string
}

export function SimilarBusinesses({ businesses, currentId }: SimilarBusinessesProps) {
  const filtered = businesses.filter((b) => b.id !== currentId).slice(0, 3)
  if (filtered.length === 0) return null

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-foreground">Similar Businesses</h2>
        <Link
          href="/explore"
          className="text-xs font-semibold transition-colors"
          style={{ color: 'rgba(139,92,246,0.8)' }}
        >
          Explore all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((b) => <MiniCard key={b.id} biz={b} />)}
      </div>
    </section>
  )
}
