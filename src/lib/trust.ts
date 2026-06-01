/**
 * Trust score: 0–100 computed from verifiable listing signals.
 * Shared between API routes and client display.
 */

interface BusinessForTrust {
  askingPrice: unknown
  revenue:     unknown
  profit:      unknown
  highlights?: string[] | null
  owner?: {
    verified?: boolean
    phone:    string | null
    bio:      string | null
  } | null
}

export function computeTrustScore(b: BusinessForTrust): number {
  const o = b.owner
  const highlights = b.highlights ?? []
  let s = 0
  if (o?.verified)                                         s += 40  // biggest signal
  if (b.askingPrice != null)                                s += 15  // price transparency
  if (b.revenue     != null)                                s += 15  // revenue disclosed
  if (b.profit      != null)                                s += 10  // full P&L
  if (o?.phone)                                            s += 5   // contactable
  if (o?.bio && o.bio.length >= 50)                        s += 10  // credible profile
  if (highlights.length >= 3)                              s += 5   // detailed listing
  return Math.min(s, 100)
}

export interface TrustMeta {
  label: string
  color: string
  bg:    string
  icon:  string
}

export function getTrustMeta(score: number): TrustMeta {
  if (score >= 80) return { label: 'High Trust', color: '#10B981', bg: 'rgba(16,185,129,0.12)',  icon: '★' }
  if (score >= 60) return { label: 'Good',        color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  icon: '◎' }
  if (score >= 40) return { label: 'Fair',        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: '○' }
  return              { label: 'Low',         color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   icon: '⚠' }
}
