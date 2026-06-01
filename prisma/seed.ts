/**
 * Finvest — database seed (idempotent for core users).
 *
 * Creates:
 *   • 1 ADMIN, 1 BUSINESS_OWNER, 1 INVESTOR, 1 BUYER
 *   • 1 InvestorProfile
 *   • Removes seeded demo businesses (keeps listings whose title contains "TJ mart")
 *   • Does not insert fake sample businesses — use the app or DB for real listings
 *
 * Run: npm run db:seed
 */

import {
  PrismaClient,
  Role,
  Industry,
  Province,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const hash = (plain: string) => bcrypt.hash(plain, 12)

function log(msg: string) {
  process.stdout.write(`  ${msg}\n`)
}

async function main() {
  console.log('\n🌱  Finvest seed starting…\n')

  // Remove legacy second owner from older seeds (messages first — FK via users)
  await prisma.message.deleteMany({
    where: {
      OR: [
        { sender: { email: 'zainab@finvest.pk' } },
        { receiver: { email: 'zainab@finvest.pk' } },
      ],
    },
  })
  await prisma.user.deleteMany({ where: { email: 'zainab@finvest.pk' } })

  const [hashAdmin, hashOwner, hashInvestor, hashBuyer] = await Promise.all([
    hash('Admin@123!'),
    hash('Owner@123!'),
    hash('Investor@123!'),
    hash('Buyer@123!'),
  ])

  const admin = await prisma.user.upsert({
    where: { email: 'admin@finvest.pk' },
    update: {},
    create: {
      email: 'admin@finvest.pk',
      password: hashAdmin,
      name: 'Finvest Admin',
      role: Role.ADMIN,
      city: 'Islamabad',
      province: Province.ISLAMABAD,
      bio: 'Platform administrator.',
      verified: true,
    },
  })

  const owner = await prisma.user.upsert({
    where: { email: 'ahmed@finvest.pk' },
    update: {},
    create: {
      email: 'ahmed@finvest.pk',
      password: hashOwner,
      name: 'Ahmed Khan',
      role: Role.BUSINESS_OWNER,
      phone: '+92-300-1234567',
      city: 'Lahore',
      province: Province.PUNJAB,
      bio: 'Serial entrepreneur with businesses across Punjab and Sindh. Focus on tech, textiles, logistics, healthcare, food, education, agriculture, and construction.',
      verified: true,
    },
  })

  const investor = await prisma.user.upsert({
    where: { email: 'sara@finvest.pk' },
    update: {},
    create: {
      email: 'sara@finvest.pk',
      password: hashInvestor,
      name: 'Sara Malik',
      role: Role.INVESTOR,
      phone: '+92-321-9876543',
      city: 'Karachi',
      province: Province.SINDH,
      bio: 'Angel investor and LP in two VC funds. Focused on Pakistani tech and FMCG. Ticket size PKR 5M–50M.',
      verified: true,
    },
  })

  const buyer = await prisma.user.upsert({
    where: { email: 'omar@finvest.pk' },
    update: {},
    create: {
      email: 'omar@finvest.pk',
      password: hashBuyer,
      name: 'Omar Siddiqui',
      role: Role.BUYER,
      phone: '+92-333-5559988',
      city: 'Islamabad',
      province: Province.ISLAMABAD,
      bio: 'CEO of Siddiqui Holdings. Actively acquiring profitable SMEs in healthcare, textile, construction, and logistics.',
      verified: true,
    },
  })

  log(`✓ Users: ${admin.name}, ${owner.name}, ${investor.name}, ${buyer.name}`)

  await prisma.investorProfile.upsert({
    where: { userId: investor.id },
    update: {},
    create: {
      userId: investor.id,
      minInvestment: 5_000_000,
      maxInvestment: 50_000_000,
      preferredIndustries: [
        Industry.TECHNOLOGY,
        Industry.FOOD_BEVERAGE,
        Industry.LOGISTICS,
        Industry.RETAIL,
        Industry.EDUCATION,
      ],
      preferredProvinces: [Province.PUNJAB, Province.SINDH, Province.ISLAMABAD],
      investmentThesis:
        "I back founders solving real problems for Pakistan's growing consumer and SME markets. Prefer capital-efficient B2B SaaS and consumer brands with proven unit economics. I add value beyond capital: GTM strategy, expansion, and fundraising introductions.",
      portfolioSize: 11,
      accredited: true,
    },
  })

  log('✓ InvestorProfile created for Sara Malik')

  const removed = await prisma.business.deleteMany({
    where: {
      NOT: { title: { contains: 'TJ mart', mode: 'insensitive' } },
    },
  })

  const kept = await prisma.business.count({
    where: { title: { contains: 'TJ mart', mode: 'insensitive' } },
  })

  log(`✓ Businesses: removed ${removed.count} demo listing(s); ${kept} TJ mart listing(s) kept`)

  console.log('\n✅  Seed complete!\n')
  console.log('  Test accounts:\n')
  console.log('  ┌──────────────────────┬────────────────┬────────────────┐')
  console.log('  │ Email                │ Role           │ Password       │')
  console.log('  ├──────────────────────┼────────────────┼────────────────┤')
  console.log('  │ admin@finvest.pk      │ ADMIN          │ Admin@123!     │')
  console.log('  │ ahmed@finvest.pk      │ BUSINESS_OWNER │ Owner@123!     │')
  console.log('  │ sara@finvest.pk       │ INVESTOR       │ Investor@123!  │')
  console.log('  │ omar@finvest.pk       │ BUYER          │ Buyer@123!     │')
  console.log('  └──────────────────────┴────────────────┴────────────────┘\n')
}

main()
  .catch((err) => {
    console.error('\n❌  Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
