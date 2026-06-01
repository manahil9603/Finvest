import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'

const INDUSTRIES = [
  'TECHNOLOGY','RETAIL','MANUFACTURING','FOOD_BEVERAGE','REAL_ESTATE',
  'HEALTHCARE','EDUCATION','AGRICULTURE','TEXTILE','LOGISTICS',
  'HOSPITALITY','FINANCE','CONSTRUCTION','MEDIA','OTHER',
] as const

const PROVINCES = [
  'PUNJAB','SINDH','KPK','BALOCHISTAN','ISLAMABAD','AJK','GILGIT_BALTISTAN',
] as const

const schema = z.object({
  minInvestment:       z.number().positive().nullable().optional(),
  maxInvestment:       z.number().positive().nullable().optional(),
  preferredIndustries: z.array(z.enum(INDUSTRIES)).max(15).default([]),
  preferredProvinces:  z.array(z.enum(PROVINCES)).max(7).default([]),
  investmentThesis:    z.string().max(1000).nullable().optional(),
  portfolioSize:       z.number().int().min(0).nullable().optional(),
  accredited:          z.boolean().default(false),
})

function serialise(p: Record<string, unknown>) {
  return {
    ...p,
    minInvestment: p.minInvestment != null ? Number(p.minInvestment) : null,
    maxInvestment: p.maxInvestment != null ? Number(p.maxInvestment) : null,
    createdAt: (p.createdAt as Date).toISOString(),
    updatedAt: (p.updatedAt as Date).toISOString(),
  }
}

/** GET — fetch the current investor's profile (or null if not set up yet) */
export async function GET(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.investorProfile.findUnique({ where: { userId: auth.userId } })
  if (!profile) return NextResponse.json({ data: null })
  return NextResponse.json({ data: serialise(profile as unknown as Record<string, unknown>) })
}

/** POST — create or update the investor profile (upsert) */
export async function POST(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'INVESTOR' && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only investors can manage an investor profile.' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { minInvestment, maxInvestment, preferredIndustries, preferredProvinces, investmentThesis, portfolioSize, accredited } = parsed.data

  if (minInvestment && maxInvestment && minInvestment > maxInvestment) {
    return NextResponse.json(
      { error: 'Minimum investment cannot exceed maximum investment.', field: 'minInvestment' },
      { status: 400 }
    )
  }

  const profile = await prisma.investorProfile.upsert({
    where:  { userId: auth.userId },
    create: {
      userId: auth.userId,
      minInvestment,
      maxInvestment,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preferredIndustries: preferredIndustries as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preferredProvinces:  preferredProvinces as any,
      investmentThesis:    investmentThesis ?? null,
      portfolioSize:       portfolioSize ?? null,
      accredited,
    },
    update: {
      minInvestment,
      maxInvestment,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preferredIndustries: preferredIndustries as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preferredProvinces:  preferredProvinces as any,
      investmentThesis:    investmentThesis ?? null,
      portfolioSize:       portfolioSize ?? null,
      accredited,
    },
  })

  return NextResponse.json({
    data:    serialise(profile as unknown as Record<string, unknown>),
    message: 'Investment profile saved!',
  })
}
