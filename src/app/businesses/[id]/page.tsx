import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { computeTrustScore } from '@/lib/trust'
import { formatPKR, INDUSTRY_LABELS, PROVINCE_LABELS, formatDate } from '@/lib/utils'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { TrustMeter } from '@/components/businesses/TrustMeter'
import { ConnectDialog } from '@/components/businesses/ConnectDialog'
import { SaveToggle } from '@/components/businesses/SaveToggle'
import { SimilarBusinesses } from '@/components/businesses/SimilarBusinesses'
import { INDUSTRY_VISUAL } from '@/components/explore/types'

// ─────────────────────────────────────────────────────────────
// Data fetchers
// ─────────────────────────────────────────────────────────────

const OWNER_SELECT = {
  id: true, name: true, role: true, verified: true,
  city: true, province: true, phone: true, bio: true,
  avatarUrl: true, createdAt: true,
} as const

async function getBusiness(id: string) {
  return prisma.business.findUnique({
    where:   { id },
    include: {
      owner:  { select: OWNER_SELECT },
      _count: { select: { connections: true, savedBy: true } },
    },
  })
}

async function getSimilar(b: NonNullable<Awaited<ReturnType<typeof getBusiness>>>) {
  return prisma.business.findMany({
    where: {
      status: 'ACTIVE',
      id:     { not: b.id },
      OR: [{ industry: b.industry }, { province: b.province }],
    },
    include: { owner: { select: { name: true, verified: true, phone: true, bio: true } } },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: 3,
  })
}

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const b = await getBusiness(id)
  if (!b) return { title: 'Business Not Found' }

  return {
    title:       `${b.title} | Finvest`,
    description: b.description.slice(0, 160),
    openGraph: {
      title:       b.title,
      description: b.description.slice(0, 160),
      type:        'article',
    },
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers / sub-components (server-side, no interactivity)
// ─────────────────────────────────────────────────────────────

function MetricTile({
  label, value, color, bg,
}: { label: string; value: string; color: string; bg: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${color}25` }}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </p>
      <p className="font-display font-black text-xl leading-none" style={{ color }}>{value}</p>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-base w-6 text-center shrink-0" aria-hidden="true">{icon}</span>
      <span className="text-xs text-fg-3 w-32 shrink-0">{label}</span>
      <span className="text-sm text-foreground font-medium">{value}</span>
    </div>
  )
}

const STAGE_PILL: Record<string, { label: string; color: string; bg: string }> = {
  IDEA:      { label: 'Idea Stage', color: '#A1A1AA', bg: 'rgba(113,113,122,0.15)' },
  STARTUP:   { label: 'Startup',    color: '#38BDF8', bg: 'rgba(14,165,233,0.12)'  },
  GROWING:   { label: 'Growing',    color: '#34D399', bg: 'rgba(16,185,129,0.12)'  },
  EXPANDING: { label: 'Expanding',  color: '#A78BFA', bg: 'rgba(139,92,246,0.12)'  },
  MATURE:    { label: 'Mature',     color: '#FB923C', bg: 'rgba(249,115,22,0.12)'  },
}

const TYPE_PILL: Record<string, { label: string; color: string; bg: string }> = {
  INVESTMENT:  { label: 'Seeking Investment',  color: '#60A5FA', bg: 'rgba(59,130,246,0.12)'  },
  ACQUISITION: { label: 'Open to Acquisition', color: '#A78BFA', bg: 'rgba(139,92,246,0.12)'  },
  PARTNERSHIP: { label: 'Seeking Partnership', color: '#FCD34D', bg: 'rgba(245,158,11,0.12)'  },
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [auth, business] = await Promise.all([
    getAuthUser(),
    getBusiness(id),
  ])

  if (!business) notFound()

  // Guests must sign up before viewing full business details
  if (!auth) {
    redirect(`/signup?redirect=${encodeURIComponent(`/businesses/${id}`)}`)
  }

  // Draft visibility gate
  if (business.status === 'DRAFT' && business.ownerId !== auth?.userId && auth?.role !== 'ADMIN') {
    notFound()
  }

  // Parallel secondary fetches
  const [similar, isSaved, existingConn] = await Promise.all([
    getSimilar(business),
    auth
      ? prisma.savedBusiness.findUnique({
          where: { userId_businessId: { userId: auth.userId, businessId: id } },
        }).then(Boolean)
      : false,
    auth
      ? prisma.connectionRequest.findFirst({
          where:   { senderId: auth.userId, businessId: id },
          select:  { status: true },
          orderBy: { createdAt: 'desc' },
        })
      : null,
  ])

  const trustScore = computeTrustScore(business as Parameters<typeof computeTrustScore>[0])
  const visual     = INDUSTRY_VISUAL[business.industry] ?? INDUSTRY_VISUAL.OTHER
  const stageCfg   = STAGE_PILL[business.stage]    ?? STAGE_PILL.IDEA
  const typeCfg    = TYPE_PILL[business.listingType] ?? TYPE_PILL.INVESTMENT

  const isOwn    = auth?.userId === business.ownerId
  const isLoggedIn = !!auth
  const connStatus = (existingConn?.status ?? 'NONE') as 'NONE'|'PENDING'|'ACCEPTED'|'REJECTED'

  // Serialise Decimals
  const askingPrice = business.askingPrice != null ? Number(business.askingPrice) : null
  const revenue     = business.revenue     != null ? Number(business.revenue)     : null
  const profit      = business.profit      != null ? Number(business.profit)      : null

  // For the user prop on Navbar
  const navUser = auth ? { id: auth.userId, name: '', role: auth.role, verified: false } : null

  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <Navbar user={navUser as any} />

      {/* ═══════════════ COVER BANNER ═══════════════ */}
      <div className="relative h-64 sm:h-80 overflow-hidden" style={{ background: visual.gradient }}>
        {business.videoUrl ? (
          <video
            src={business.videoUrl}
            controls
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : business.imageUrls.length > 0 ? (
          <Image
            src={business.imageUrls[0]}
            alt={business.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="text-7xl sm:text-8xl select-none"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}
              aria-hidden="true"
            >
              {visual.emoji}
            </div>
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />

        {/* Top-left badges */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2">
          {business.owner.verified && (
            <span
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.25)', color: '#34D399', border: '1px solid rgba(16,185,129,0.4)', backdropFilter: 'blur(12px)' }}
            >
              ✅ Verified Owner
            </span>
          )}
          {business.status !== 'ACTIVE' && (
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)', backdropFilter: 'blur(12px)' }}
            >
              {business.status}
            </span>
          )}
        </div>

        {/* Top-right badges */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
          {business.featured && (
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)', color: '#fff', boxShadow: '0 4px 12px rgba(107,33,168,0.4)', backdropFilter: 'blur(12px)' }}
            >
              ⭐ Featured
            </span>
          )}
          {/* Save icon on banner (mobile quick-save) */}
          <div className="sm:hidden">
            <SaveToggle
              businessId={id}
              initialSaved={isSaved}
              isOwn={isOwn}
              isLoggedIn={isLoggedIn}
              variant="icon"
            />
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-1.5 text-xs text-white/50">
          <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
          <span>/</span>
          <span className="text-white/70 truncate max-w-[200px]">{business.title}</span>
        </div>
      </div>

      {/* ═══════════════ BODY ═══════════════ */}
      <div className="page-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ══ LEFT — Main content ══════════════════════════════ */}
          <main className="flex-1 min-w-0">

            {/* Business title + meta row */}
            <div className="mb-8">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-foreground leading-tight mb-4">
                {business.title}
              </h1>

              {/* Pills row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.color}30` }}
                >
                  {typeCfg.label}
                </span>
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: stageCfg.bg, color: stageCfg.color }}
                >
                  {stageCfg.label}
                </span>
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                >
                  📍 {business.city}, {PROVINCE_LABELS[business.province] ?? business.province}
                </span>
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                >
                  🏭 {INDUSTRY_LABELS[business.industry] ?? business.industry}
                </span>
              </div>

              <p className="text-xs text-fg-3">
                Listed {formatDate(business.createdAt.toISOString())}
                {business._count.savedBy > 0 && ` · ${business._count.savedBy} investor${business._count.savedBy !== 1 ? 's' : ''} watching`}
                {business._count.connections > 0 && ` · ${business._count.connections} connection request${business._count.connections !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Key metrics row (mobile-first, shown before desc) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 lg:hidden">
              <MetricTile
                label="Funding Required"
                value={askingPrice != null ? formatPKR(askingPrice) : 'Not disclosed'}
                color="#A78BFA"
                bg="rgba(139,92,246,0.1)"
              />
              <MetricTile
                label="Revenue Range"
                value={revenue != null ? formatPKR(revenue) : 'Not disclosed'}
                color="#34D399"
                bg="rgba(16,185,129,0.08)"
              />
              {profit != null && (
                <MetricTile
                  label="Annual Profit"
                  value={formatPKR(profit)}
                  color="#60A5FA"
                  bg="rgba(59,130,246,0.08)"
                />
              )}
            </div>

            {/* ── About ─────────────────────────────────────────── */}
            <section
              className="rounded-3xl p-6 sm:p-8 mb-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="font-display font-bold text-lg text-foreground mb-4">About This Business</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-sm text-fg-2 leading-relaxed whitespace-pre-line">
                  {business.description}
                </p>
              </div>
            </section>

            {/* ── Photo gallery (when video is hero or multiple photos) ── */}
            {(() => {
              const photos = business.videoUrl ? business.imageUrls : business.imageUrls.slice(1)
              if (photos.length === 0) return null
              return (
                <section
                  className="rounded-3xl p-6 sm:p-8 mb-6"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <h2 className="font-display font-bold text-lg text-foreground mb-4">Photos</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((src, i) => (
                      <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                        <Image src={src} alt={`${business.title} photo ${i + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </section>
              )
            })()}

            {/* ── Highlights ────────────────────────────────────── */}
            {business.highlights.length > 0 && (
              <section
                className="rounded-3xl p-6 sm:p-8 mb-6"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <h2 className="font-display font-bold text-lg text-foreground mb-4">Key Highlights</h2>
                <ul className="space-y-3">
                  {business.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399' }}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <span className="text-sm text-fg-2 leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── Business Details ──────────────────────────────── */}
            <section
              className="rounded-3xl p-6 sm:p-8 mb-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="font-display font-bold text-lg text-foreground mb-4">Business Details</h2>
              <div>
                {askingPrice != null && (
                  <DetailRow icon="💰" label="Funding Required" value={formatPKR(askingPrice)} />
                )}
                {revenue != null && (
                  <DetailRow icon="📈" label="Annual Revenue" value={formatPKR(revenue)} />
                )}
                {profit != null && (
                  <DetailRow icon="📊" label="Annual Profit" value={formatPKR(profit)} />
                )}
                {business.employees != null && (
                  <DetailRow icon="👥" label="Team Size" value={`${business.employees} employee${business.employees !== 1 ? 's' : ''}`} />
                )}
                {business.established != null && (
                  <DetailRow icon="📅" label="Year Established" value={`${business.established} (${new Date().getFullYear() - business.established} years old)`} />
                )}
                <DetailRow icon="🏭" label="Industry" value={INDUSTRY_LABELS[business.industry] ?? business.industry} />
                <DetailRow icon="🗺️" label="Province" value={PROVINCE_LABELS[business.province] ?? business.province} />
                <DetailRow icon="📍" label="City" value={business.city} />
                <DetailRow icon="🎯" label="Opportunity" value={typeCfg.label} />
                <DetailRow icon="📶" label="Business Stage" value={stageCfg.label} />
                <DetailRow icon="📋" label="Registration" value={business.isRegistered ? 'Legally registered' : 'Not registered'} />
                {business.seekingOperator && (
                  <DetailRow icon="👔" label="Leadership" value="Seeking a skilled operator / CEO" />
                )}
              </div>

              {/* Financial disclaimer */}
              <div
                className="mt-5 rounded-2xl px-4 py-3 text-xs leading-relaxed"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(253,186,116,0.75)' }}
              >
                ⚠ All financial figures are self-reported by the business owner and have not been
                independently verified by Finvest. Always conduct your own due diligence.
              </div>
            </section>

            {/* ── Owner info (mobile) ───────────────────────────── */}
            <div className="lg:hidden mb-8">
              <OwnerCard business={business} />
            </div>

            {/* ── Connect + Save (mobile) ───────────────────────── */}
            <div className="lg:hidden flex flex-col gap-3 mb-8">
              <ConnectDialog
                businessId={id}
                businessTitle={business.title}
                ownerName={business.owner.name}
                ownerId={business.ownerId}
                listingType={business.listingType}
                currentUserId={auth?.userId ?? null}
                currentRole={(auth?.role ?? null) as any}
                initialStatus={connStatus}
              />
              <SaveToggle
                businessId={id}
                initialSaved={isSaved}
                isOwn={isOwn}
                isLoggedIn={isLoggedIn}
              />
            </div>

            {/* ── Similar businesses ────────────────────────────── */}
            <SimilarBusinesses
              businesses={similar.map((b) => ({
                ...b,
                askingPrice: b.askingPrice != null ? Number(b.askingPrice) : null,
                revenue:     b.revenue     != null ? Number(b.revenue)     : null,
                profit:      b.profit      != null ? Number(b.profit)      : null,
                highlights:  b.highlights,
                createdAt:   b.createdAt.toISOString(),
              }))}
              currentId={id}
            />
          </main>

          {/* ══ RIGHT — Sticky sidebar ═══════════════════════════ */}
          <aside className="hidden lg:flex flex-col gap-4 w-[300px] shrink-0">
            <div className="sticky top-24 flex flex-col gap-4">

              {/* Funding & Revenue cards */}
              <div
                className="rounded-3xl p-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <div className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[10px] text-fg-3 font-bold uppercase tracking-wider mb-1">Funding Required</p>
                  <p className="font-display font-black text-2xl" style={{ color: '#A78BFA' }}>
                    {askingPrice != null ? formatPKR(askingPrice) : 'Not disclosed'}
                  </p>
                </div>
                <div className={profit != null ? 'mb-3 pb-3' : ''} style={profit != null ? { borderBottom: '1px solid rgba(255,255,255,0.07)' } : {}}>
                  <p className="text-[10px] text-fg-3 font-bold uppercase tracking-wider mb-1">Revenue Range</p>
                  <p className="font-display font-black text-2xl" style={{ color: '#34D399' }}>
                    {revenue != null ? formatPKR(revenue) : 'Not disclosed'}
                  </p>
                </div>
                {profit != null && (
                  <div>
                    <p className="text-[10px] text-fg-3 font-bold uppercase tracking-wider mb-1">Annual Profit</p>
                    <p className="font-display font-black text-2xl" style={{ color: '#60A5FA' }}>
                      {formatPKR(profit)}
                    </p>
                  </div>
                )}
              </div>

              {/* Trust score meter */}
              <div
                className="rounded-3xl p-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <p className="text-[10px] text-fg-3 font-bold uppercase tracking-wider mb-4">Trust Score</p>
                <div className="flex justify-center">
                  <TrustMeter score={trustScore} showBreakdown />
                </div>
              </div>

              {/* Connect & Save */}
              <div className="flex flex-col gap-2.5">
                <ConnectDialog
                  businessId={id}
                  businessTitle={business.title}
                  ownerName={business.owner.name}
                  ownerId={business.ownerId}
                  listingType={business.listingType}
                  currentUserId={auth?.userId ?? null}
                  currentRole={(auth?.role ?? null) as any}
                  initialStatus={connStatus}
                />
                <SaveToggle
                  businessId={id}
                  initialSaved={isSaved}
                  isOwn={isOwn}
                  isLoggedIn={isLoggedIn}
                />
              </div>

              {/* Owner card */}
              <OwnerCard business={business} />
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Owner card (server component, no interactivity)
// ─────────────────────────────────────────────────────────────

function OwnerCard({
  business,
}: {
  business: NonNullable<Awaited<ReturnType<typeof getBusiness>>>
}) {
  const { owner } = business
  const joinedYear = owner.createdAt.getFullYear()

  return (
    <div
      className="rounded-3xl p-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
    >
      <p className="text-[10px] text-fg-3 font-bold uppercase tracking-wider mb-4">Listed by</p>

      <div className="flex items-center gap-3 mb-4">
        {owner.avatarUrl ? (
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0">
            <Image src={owner.avatarUrl} alt={owner.name} width={48} height={48} className="object-cover" />
          </div>
        ) : (
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-xl text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}
            aria-hidden="true"
          >
            {owner.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm flex items-center gap-1.5 flex-wrap">
            {owner.name}
            {owner.verified && <span title="Verified profile" className="text-brand-green text-xs">✅</span>}
          </p>
          <p className="text-xs text-fg-3">
            Business Owner · {owner.city ?? 'Pakistan'}
          </p>
          <p className="text-[11px] text-fg-3 mt-0.5">Member since {joinedYear}</p>
        </div>
      </div>

      {owner.bio && (
        <p className="text-xs text-fg-2 leading-relaxed line-clamp-3 mb-4">{owner.bio}</p>
      )}

      {owner.phone && (
        <div
          className="flex items-center gap-2 text-xs text-fg-3 mb-4 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span>📞</span>
          <span className="font-mono">{owner.phone}</span>
          <span className="text-[10px] text-fg-3">(after connecting)</span>
        </div>
      )}

      <Link
        href={`/messages`}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        View Messages
      </Link>
    </div>
  )
}
