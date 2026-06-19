export function formatPKR(amount: number): string {
  if (amount >= 10000000) return `PKR ${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000) return `PKR ${(amount / 100000).toFixed(1)} Lac`
  return `PKR ${amount.toLocaleString('en-PK')}`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Accept only same-origin paths — blocks open redirects. */
export function safeInternalRedirect(param: string | null | undefined): string | null {
  const s = param?.trim()
  if (!s) return null
  if (!s.startsWith('/') || s.startsWith('//')) return null
  if (s.includes('://')) return null
  return s
}

/** Business detail URL — guests are sent to sign in first with a return path. */
export function businessDetailHref(businessId: string, isLoggedIn: boolean): string {
  const detail = `/businesses/${businessId}`
  if (isLoggedIn) return detail
  return `/login?redirect=${encodeURIComponent(detail)}`
}

export const INDUSTRY_LABELS: Record<string, string> = {
  TECHNOLOGY: 'Technology',
  RETAIL: 'Retail',
  MANUFACTURING: 'Manufacturing',
  FOOD_BEVERAGE: 'Food & Beverage',
  REAL_ESTATE: 'Real Estate',
  HEALTHCARE: 'Healthcare',
  EDUCATION: 'Education',
  AGRICULTURE: 'Agriculture',
  TEXTILE: 'Textile',
  LOGISTICS: 'Logistics',
  HOSPITALITY: 'Hospitality',
  FINANCE: 'Finance',
  CONSTRUCTION: 'Construction',
  MEDIA: 'Media',
  OTHER: 'Other',
}

export const PROVINCE_LABELS: Record<string, string> = {
  PUNJAB: 'Punjab',
  SINDH: 'Sindh',
  KPK: 'KPK',
  BALOCHISTAN: 'Balochistan',
  ISLAMABAD: 'Islamabad',
  AJK: 'AJK',
  GILGIT_BALTISTAN: 'Gilgit-Baltistan',
}

export const TYPE_LABELS: Record<string, string> = {
  INVESTMENT: 'Investment',
  ACQUISITION: 'Acquisition',
  PARTNERSHIP: 'Partnership',
}

export const TYPE_COLORS: Record<string, string> = {
  INVESTMENT: 'bg-blue-100 text-blue-800',
  ACQUISITION: 'bg-purple-100 text-purple-800',
  PARTNERSHIP: 'bg-amber-100 text-amber-800',
}

export const STAGE_LABELS: Record<string, string> = {
  IDEA: 'Idea Stage',
  STARTUP: 'Startup',
  GROWING: 'Growing',
  EXPANDING: 'Expanding',
  MATURE: 'Mature',
}

export const STAGE_COLORS: Record<string, string> = {
  IDEA: 'bg-gray-100 text-gray-700',
  STARTUP: 'bg-sky-100 text-sky-700',
  GROWING: 'bg-emerald-100 text-emerald-700',
  EXPANDING: 'bg-violet-100 text-violet-700',
  MATURE: 'bg-orange-100 text-orange-700',
}

export const CONNECTION_TYPE_LABELS: Record<string, string> = {
  INVESTMENT: 'Investment',
  BUYING: 'Acquisition',
}

export const CONNECTION_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
}
