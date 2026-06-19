import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { computeTrustScore } from '@/lib/trust'
import { ExpertShell } from '@/components/dashboard/expert/ExpertShell'

export const metadata: Metadata = { title: 'Business Expert Dashboard' }

const OWNER_SELECT = {
  id: true, name: true, role: true, verified: true,
  city: true, province: true, phone: true, bio: true,
} as const

export default async function ExpertDashboardPage() {
  const auth = await requireAuth(['BUSINESS_EXPERT', 'ADMIN'])

  const user = await prisma.user.findUnique({
    where:  { id: auth.userId },
    select: { id: true, name: true, city: true, verified: true },
  })
  if (!user) redirect('/login')

  const [profile, opportunities] = await Promise.all([
    prisma.businessExpertProfile.findUnique({ where: { userId: auth.userId } }),
    prisma.business.findMany({
      where:   { status: 'ACTIVE', seekingOperator: true },
      include: { owner: { select: OWNER_SELECT } },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take:    12,
    }),
  ])

  const serialisedProfile = profile ? {
    id:                  profile.id,
    yearsExperience:     profile.yearsExperience,
    skills:              profile.skills,
    preferredIndustries: profile.preferredIndustries as string[],
    expertSummary:       profile.expertSummary,
    available:           profile.available,
  } : null

  const serialisedOpportunities = opportunities.map((b) => ({
    id:              b.id,
    title:           b.title,
    industry:        b.industry,
    city:            b.city,
    province:        b.province,
    listingType:     b.listingType,
    stage:           b.stage,
    askingPrice:     b.askingPrice != null ? Number(b.askingPrice) : null,
    isRegistered:    b.isRegistered,
    seekingOperator: b.seekingOperator,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trustScore:      computeTrustScore(b as any),
    createdAt:       b.createdAt.toISOString(),
    owner:           { id: b.owner.id, name: b.owner.name, verified: b.owner.verified },
  }))

  return (
    <ExpertShell
      user={user}
      profile={serialisedProfile}
      opportunities={serialisedOpportunities}
    />
  )
}
