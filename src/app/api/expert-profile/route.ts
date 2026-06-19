import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/auth'
import { sanitizeShort, sanitizeStringArray } from '@/lib/sanitize'

const INDUSTRIES = [
  'TECHNOLOGY', 'RETAIL', 'MANUFACTURING', 'FOOD_BEVERAGE', 'REAL_ESTATE',
  'HEALTHCARE', 'EDUCATION', 'AGRICULTURE', 'TEXTILE', 'LOGISTICS',
  'HOSPITALITY', 'FINANCE', 'CONSTRUCTION', 'MEDIA', 'OTHER',
] as const

const schema = z.object({
  yearsExperience:     z.number().int().min(1).max(50).nullable().optional(),
  skills:              z.array(z.string().max(80).trim()).max(12).default([]),
  preferredIndustries: z.array(z.enum(INDUSTRIES)).max(15).default([]),
  expertSummary:       z.string().max(1000).nullable().optional(),
  available:           z.boolean().default(true),
})

function serialise(p: Record<string, unknown>) {
  return {
    ...p,
    createdAt: (p.createdAt as Date).toISOString(),
    updatedAt: (p.updatedAt as Date).toISOString(),
  }
}

/** GET — fetch the current expert's profile */
export async function GET(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.businessExpertProfile.findUnique({ where: { userId: auth.userId } })
  if (!profile) return NextResponse.json({ data: null })
  return NextResponse.json({ data: serialise(profile as unknown as Record<string, unknown>) })
}

/** POST — create or update the expert profile */
export async function POST(req: NextRequest) {
  const auth = getAuthUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (auth.role !== 'BUSINESS_EXPERT' && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only business experts can manage an expert profile.' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]!.message }, { status: 400 })
  }

  const { yearsExperience, skills, preferredIndustries, expertSummary, available } = parsed.data

  const profile = await prisma.businessExpertProfile.upsert({
    where:  { userId: auth.userId },
    create: {
      userId: auth.userId,
      yearsExperience: yearsExperience ?? null,
      skills: sanitizeStringArray(skills, { maxItems: 12, maxItemLen: 80 }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preferredIndustries: preferredIndustries as any,
      expertSummary: expertSummary ? sanitizeShort(expertSummary, 1000) : null,
      available,
    },
    update: {
      yearsExperience: yearsExperience ?? null,
      skills: sanitizeStringArray(skills, { maxItems: 12, maxItemLen: 80 }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preferredIndustries: preferredIndustries as any,
      expertSummary: expertSummary ? sanitizeShort(expertSummary, 1000) : null,
      available,
    },
  })

  return NextResponse.json({
    data:    serialise(profile as unknown as Record<string, unknown>),
    message: 'Expert profile saved!',
  })
}
