'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPKR, INDUSTRY_LABELS, PROVINCE_LABELS } from '@/lib/utils'
import { getTrustMeta } from '@/lib/trust'
import { INDUSTRY_VISUAL } from '@/components/explore/types'
import { ExpertProfileForm, type ExpertProfileData } from './ExpertProfileForm'

interface Opportunity {
  id: string
  title: string
  industry: string
  city: string
  province: string
  listingType: string
  stage: string
  askingPrice: number | null
  isRegistered: boolean
  seekingOperator: boolean
  trustScore: number
  createdAt: string
  owner: { id: string; name: string; verified: boolean }
}

interface Props {
  user:          { id: string; name: string; city: string | null; verified: boolean }
  profile:       ExpertProfileData | null
  opportunities: Opportunity[]
}

function OpportunityCard({ biz }: { biz: Opportunity }) {
  const visual = INDUSTRY_VISUAL[biz.industry] ?? INDUSTRY_VISUAL.OTHER
  const trust  = getTrustMeta(biz.trustScore)

  return (
    <Link href={`/businesses/${biz.id}`}
          className="group block rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="h-28 relative flex items-end p-4"
           style={{ background: visual.gradient }}>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: trust.bg, color: trust.color }}>
            {trust.icon} {biz.trustScore}
          </span>
        </div>
        <span className="text-2xl">{visual.emoji}</span>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139,92,246,0.15)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.3)' }}>
            Seeking operator
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: biz.isRegistered ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: biz.isRegistered ? '#34D399' : '#FCD34D' }}>
            {biz.isRegistered ? 'Registered' : 'Unregistered'}
          </span>
        </div>
        <h3 className="font-display font-bold text-foreground mb-1 line-clamp-2 group-hover:text-brand-purple-light transition-colors">
          {biz.title}
        </h3>
        <p className="text-xs text-fg-3 mb-3">
          {biz.city}, {PROVINCE_LABELS[biz.province] ?? biz.province} · {INDUSTRY_LABELS[biz.industry] ?? biz.industry}
        </p>
        {biz.askingPrice != null && (
          <p className="text-sm font-semibold" style={{ color: '#A78BFA' }}>
            Funding: {formatPKR(biz.askingPrice)}
          </p>
        )}
        <p className="text-xs text-fg-3 mt-2">Owner: {biz.owner.name}{biz.owner.verified ? ' ✓' : ''}</p>
      </div>
    </Link>
  )
}

export function ExpertShell({ user, profile: initialProfile, opportunities: initialOpps }: Props) {
  const [profile, setProfile] = useState(initialProfile)

  return (
    <div className="min-h-dvh pb-16">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-2">Business Expert</p>
          <h1 className="font-display font-black text-3xl text-foreground mb-1">
            Welcome, {user.name.split(' ')[0]}
          </h1>
          <p className="text-fg-2 text-sm">
            {user.city ? `${user.city} · ` : ''}Find businesses that need a skilled operator or CEO.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <ExpertProfileForm initial={profile} onSaved={setProfile} />
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-3xl p-6 sm:p-8"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground">Operator opportunities</h2>
                  <p className="text-sm text-fg-3">Businesses looking for someone with your skills to run them.</p>
                </div>
                <Link href="/explore?seekingOperator=true"
                      className="text-xs font-semibold text-brand-purple-light hover:underline shrink-0">
                  Browse all →
                </Link>
              </div>

              {initialOpps.length === 0 ? (
                <div className="text-center py-12 text-fg-3 text-sm">
                  No businesses are seeking an operator yet. Check back soon or complete your profile.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {initialOpps.map((biz) => (
                    <OpportunityCard key={biz.id} biz={biz} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
