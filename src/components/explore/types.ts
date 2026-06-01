import type { Business, UserRef } from '@/types'

/** Business as returned by GET /api/businesses — includes computed fields */
export interface BusinessResult extends Omit<Business, 'owner'> {
  trustScore: number
  isSaved:    boolean
  owner: UserRef & { phone: string | null; bio: string | null }
  _count: { connections: number; savedBy: number }
}

/** All active filter state — mirrors URL search params */
export interface FilterState {
  q:              string
  industry:       string
  province:       string
  listingType:    string
  stages:         string[]
  minAskingPrice: number   // 0 = no lower bound
  maxAskingPrice: number   // 0 = no upper bound
  minRevenue:     number
  maxRevenue:     number
  verifiedOnly:   boolean
  minTrustScore:  number   // 0–100
  sortBy:         SortOption
  page:           number
}

export type SortOption = 'featured' | 'newest' | 'trustScore' | 'askingPrice' | 'revenue'

export interface PaginationMeta {
  total:  number
  page:   number
  pages:  number
  limit:  number
}

// ── Pre-defined ranges (shown as radio groups in the sidebar) ─────────────────

export interface Range {
  label: string
  min:   number
  max:   number   // 0 = no limit
}

export const FUNDING_RANGES: Range[] = [
  { label: 'Any amount',     min: 0,           max: 0 },
  { label: 'Under 25 Lac',   min: 1,           max: 2_500_000 },
  { label: '25 – 50 Lac',    min: 2_500_001,   max: 5_000_000 },
  { label: '50 Lac – 1 Cr',  min: 5_000_001,   max: 10_000_000 },
  { label: '1 – 5 Crore',    min: 10_000_001,  max: 50_000_000 },
  { label: '5 – 20 Crore',   min: 50_000_001,  max: 200_000_000 },
  { label: '20 Crore+',      min: 200_000_001, max: 0 },
]

export const REVENUE_RANGES: Range[] = [
  { label: 'Any amount',      min: 0,           max: 0 },
  { label: 'Under 10 Lac',    min: 1,           max: 1_000_000 },
  { label: '10 – 50 Lac',     min: 1_000_001,   max: 5_000_000 },
  { label: '50 Lac – 2 Cr',   min: 5_000_001,   max: 20_000_000 },
  { label: '2 – 10 Crore',    min: 20_000_001,  max: 100_000_000 },
  { label: '10 Crore+',       min: 100_000_001, max: 0 },
]

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured',    label: 'Featured first' },
  { value: 'newest',      label: 'Newest' },
  { value: 'trustScore',  label: 'Highest trust score' },
  { value: 'askingPrice', label: 'Highest asking price' },
  { value: 'revenue',     label: 'Highest revenue' },
]

export const DEFAULT_FILTERS: FilterState = {
  q:              '',
  industry:       '',
  province:       '',
  listingType:    '',
  stages:         [],
  minAskingPrice: 0,
  maxAskingPrice: 0,
  minRevenue:     0,
  maxRevenue:     0,
  verifiedOnly:   false,
  minTrustScore:  0,
  sortBy:         'featured',
  page:           1,
}

// ── Industry visual identities ────────────────────────────────────────────────

export const INDUSTRY_VISUAL: Record<string, { gradient: string; emoji: string }> = {
  TECHNOLOGY:    { gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0369a1 100%)', emoji: '💻' },
  RETAIL:        { gradient: 'linear-gradient(135deg, #4a1a4a 0%, #a21caf 100%)', emoji: '🛍️' },
  MANUFACTURING: { gradient: 'linear-gradient(135deg, #1c2b1c 0%, #15803d 100%)', emoji: '🏭' },
  FOOD_BEVERAGE: { gradient: 'linear-gradient(135deg, #3d1500 0%, #c2410c 100%)', emoji: '🍽️' },
  REAL_ESTATE:   { gradient: 'linear-gradient(135deg, #083344 0%, #0284c7 100%)', emoji: '🏢' },
  HEALTHCARE:    { gradient: 'linear-gradient(135deg, #0f2a2a 0%, #0d9488 100%)', emoji: '🏥' },
  EDUCATION:     { gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', emoji: '📚' },
  AGRICULTURE:   { gradient: 'linear-gradient(135deg, #14281d 0%, #4d7c0f 100%)', emoji: '🌾' },
  TEXTILE:       { gradient: 'linear-gradient(135deg, #4c0519 0%, #be123c 100%)', emoji: '🧵' },
  LOGISTICS:     { gradient: 'linear-gradient(135deg, #1e293b 0%, #1d4ed8 100%)', emoji: '🚛' },
  HOSPITALITY:   { gradient: 'linear-gradient(135deg, #431407 0%, #b45309 100%)', emoji: '🏨' },
  FINANCE:       { gradient: 'linear-gradient(135deg, #052e16 0%, #059669 100%)', emoji: '💳' },
  CONSTRUCTION:  { gradient: 'linear-gradient(135deg, #18181b 0%, #c2410c 100%)', emoji: '🏗️' },
  MEDIA:         { gradient: 'linear-gradient(135deg, #2e1065 0%, #7c3aed 100%)', emoji: '📺' },
  OTHER:         { gradient: 'linear-gradient(135deg, #18181b 0%, #52525b 100%)', emoji: '💼' },
}
