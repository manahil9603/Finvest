import Link from 'next/link'
import { formatPKR, INDUSTRY_LABELS, timeAgo, businessDetailHref } from '@/lib/utils'
import { TypeBadge, StageBadge, Badge } from '@/components/ui/Badge'
import type { Business } from '@/types'

interface ListingCardProps {
  listing: Business
  compact?: boolean
  isLoggedIn?: boolean
}

export function ListingCard({ listing, compact, isLoggedIn = false }: ListingCardProps) {
  return (
    <Link
      href={businessDetailHref(listing.id, isLoggedIn)}
      className="card card-lift flex flex-col group overflow-hidden noPad"
      style={{ padding: 0 }}
    >
      {/* Gradient accent bar */}
      <div
        className="h-1 w-full shrink-0"
        style={{ background: 'linear-gradient(90deg, #6B21A8, #8B5CF6, #10B981)' }}
      />

      <div className="p-5 flex flex-col flex-1">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <TypeBadge type={listing.listingType} />
          <StageBadge stage={listing.stage} />
          {listing.featured && (
            <Badge variant="gradient">⭐ Featured</Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-foreground leading-snug mb-1.5 group-hover:text-brand-purple-light transition-colors line-clamp-2">
          {listing.title}
        </h3>

        {/* Industry + city */}
        <div className="flex items-center gap-2 text-xs text-fg-3 mb-3">
          <span>{INDUSTRY_LABELS[listing.industry] ?? listing.industry}</span>
          <span aria-hidden="true">·</span>
          <span>📍 {listing.city}</span>
        </div>

        {!compact && (
          <p className="text-sm text-fg-2 leading-relaxed mb-4 line-clamp-2">
            {listing.description}
          </p>
        )}

        {/* Financial highlights */}
        <div className="mt-auto grid grid-cols-2 gap-2.5">
          {listing.askingPrice != null && (
            <div
              className="rounded-2xl p-3"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
            >
              <div className="text-[10px] text-fg-3 font-semibold uppercase tracking-wide">Asking</div>
              <div className="font-bold text-brand-purple-light text-sm mt-0.5 truncate">
                {formatPKR(Number(listing.askingPrice))}
              </div>
            </div>
          )}
          {listing.revenue != null && (
            <div
              className="rounded-2xl p-3"
              style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <div className="text-[10px] text-fg-3 font-semibold uppercase tracking-wide">Revenue</div>
              <div className="font-bold text-brand-green-glow text-sm mt-0.5 truncate">
                {formatPKR(Number(listing.revenue))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-4 pt-3 text-xs text-fg-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="flex items-center gap-1 truncate">
            {listing.owner.verified && <span title="Verified user" aria-label="Verified">✅</span>}
            <span className="truncate">{listing.owner.name}</span>
          </span>
          <time className="shrink-0 ml-2">{timeAgo(listing.createdAt)}</time>
        </div>
      </div>
    </Link>
  )
}
