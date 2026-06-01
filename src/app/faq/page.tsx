import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { FaqAccordion, type FaqItem } from '@/components/pages/FaqAccordion'
import { getAuthUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'FAQ | Finvest',
  description: 'Frequently asked questions about Finvest — account creation, listings, trust scores, connections, and more.',
}

const FAQS: FaqItem[] = [
  {
    category: 'Account',
    q: 'How do I create a Finvest account?',
    a: `Creating an account takes under 2 minutes. Visit finvest.pk/signup and choose your role:

• <strong>Business Owner</strong> — to list and grow your business
• <strong>Investor</strong> — to discover and fund SMEs
• <strong>Buyer</strong> — to find and acquire businesses

Enter your name, email, phone, city, and a secure password. You can update your profile details anytime from your dashboard. There is no cost to create an account — the Basic plan is free forever.`,
  },
  {
    category: 'Listings',
    q: 'How do I list my business on Finvest?',
    a: `Once registered as a Business Owner, go to <strong>Dashboard → List New Business</strong>. You'll fill in:

• Business name and detailed description
• Industry, province, and city
• What you're seeking (Investment, Acquisition, or Partnership)
• Financial details: asking price, annual revenue, profit, employee count, year established
• Up to 6 key highlights (e.g. "ISO certified", "EU export contracts")
• Up to 5 business photos

Choose <strong>Save as Draft</strong> to refine before publishing, or <strong>Submit for Review</strong> to go live. Our team reviews submissions before they appear in public search results, typically within 24–48 hours.`,
  },
  {
    category: 'Verification',
    q: 'How does profile verification work?',
    a: `Finvest verification is a manual process conducted by our team. To apply:

1. Complete your profile fully (name, phone, city, bio, company name)
2. Submit your listing for review
3. Our team cross-references public information and may request supporting documents

Once verified, you receive a <strong>✅ Verified Owner</strong> badge on your profile and all listings. This badge adds <strong>+40 points</strong> to your trust score — the single largest trust signal on the platform.

Verification is subject to Finvest's Terms of Service and can be revoked if information is found to be misleading.`,
  },
  {
    category: 'Trust Score',
    q: 'What is the Trust Score and how is it calculated?',
    a: `The <strong>Trust Score (0–100)</strong> reflects how complete, transparent, and credible a listing is. It is computed automatically from 7 signals:

• <strong>+40</strong> — Owner is verified by Finvest
• <strong>+15</strong> — Asking price is disclosed
• <strong>+15</strong> — Annual revenue is disclosed
• <strong>+10</strong> — Annual profit/EBITDA is disclosed
• <strong>+10</strong> — Owner has a complete bio (50+ characters)
• <strong>+5</strong>  — Owner has added a phone number
• <strong>+5</strong>  — Listing has 3 or more key highlights

A score of 80+ indicates a highly credible listing. All financial figures are <strong>self-reported and unverified</strong> by Finvest — always conduct independent due diligence regardless of the score.`,
  },
  {
    category: 'Connections',
    q: 'How do connection requests work?',
    a: `Investors and buyers can send a <strong>Connection Request</strong> to any active business listing. The process:

1. Investor/buyer clicks "Send Connection Request" on a listing page
2. They write a personalised introduction message (min. 30 characters)
3. The business owner receives a notification and can <strong>Accept</strong> or <strong>Decline</strong>
4. If accepted, both parties can message each other directly

Connection requests are categorised as either <strong>Investment</strong> or <strong>Acquisition</strong> based on the listing type. Business owners cannot send connection requests to other listings — that function is reserved for investors and buyers.

Each (sender × business × type) combination is limited to one request to prevent spam.`,
  },
  {
    category: 'Messaging',
    q: 'Who can I message on Finvest?',
    a: `Direct messaging is available <strong>only between users with an accepted connection request</strong>. This prevents unsolicited messages and maintains platform quality.

The full flow:
1. Investor/buyer sends a connection request
2. Business owner accepts
3. Both parties can now exchange messages

Messages are delivered in real-time via our Socket.io server. If real-time is unavailable, the system falls back to automatic polling every 5 seconds.

<strong>Important:</strong> Do not share sensitive financial documents, passwords, or banking information in messages. Conduct document exchange through secure, verified offline channels.`,
  },
  {
    category: 'Premium',
    q: 'What do I get with a paid plan?',
    a: `Finvest offers three plans:

<strong>Basic (Free)</strong>
• 1 business listing
• Standard search placement
• Messaging (accepted connections only)

<strong>Boost — PKR 5,000/month</strong>
• 3 business listings
• ⭐ Featured placement in search and investor recommendations
• Featured badge on all listings

<strong>Premium — PKR 15,000/month</strong>
• Unlimited listings
• ⭐ Featured placement
• Priority verified badge review
• Analytics dashboard (coming soon)
• Dedicated support

All paid plans are billed monthly. Cancel anytime. See the <a href="/pricing" style="color:#A78BFA;font-weight:600">Pricing page</a> for full details.`,
  },
  {
    category: 'Safety',
    q: 'How does Finvest protect users from fraud?',
    a: `We take platform safety seriously. Our protections include:

• <strong>Listing review:</strong> Every new listing is reviewed by our team before going live
• <strong>Verified badges:</strong> Owners are manually verified against publicly available information
• <strong>Trust scores:</strong> Transparent 0–100 score flags low-disclosure listings
• <strong>Connection gates:</strong> Messaging is gated behind accepted connections
• <strong>Report system:</strong> Users can flag suspicious listings or profiles (coming soon)
• <strong>Admin tools:</strong> Our team can suspend or remove accounts that violate our Terms

Despite these measures, Finvest is a marketplace and <strong>cannot guarantee the accuracy of any self-reported financial data</strong>. Always verify claims independently before making any investment or acquisition decision.`,
  },
  {
    category: 'Legal',
    q: 'Does Finvest provide financial or investment advice?',
    a: `<strong>No. Finvest does not provide financial advice of any kind.</strong>

Finvest is strictly a marketplace that facilitates introductions between business owners, investors, and buyers. We do not:

• Advise on whether a particular investment is suitable for you
• Verify or audit self-reported financial figures
• Mediate or facilitate financial transactions
• Act as a broker, dealer, or advisor under SECP regulations
• Guarantee any deal, return, or outcome

We are not registered with or regulated by the Securities and Exchange Commission of Pakistan (SECP) as a financial institution or investment advisor.

<strong>You must conduct your own due diligence</strong> and consult a qualified financial advisor, chartered accountant, and lawyer before making any investment or acquisition decision.`,
  },
  {
    category: 'Due Diligence',
    q: 'What due diligence should I conduct before investing or acquiring?',
    a: `Finvest strongly recommends the following before any investment or acquisition:

<strong>Financial due diligence</strong>
• Request 2–3 years of audited financial statements from a qualified CA firm
• Verify revenue, profit, and cash flow independently
• Review outstanding liabilities, debts, and pending litigation

<strong>Legal due diligence</strong>
• Engage a qualified lawyer to review ownership documents and title
• Check for encumbrances, regulatory violations, or pending lawsuits
• Review all material contracts (leases, supplier agreements, employment)

<strong>Operational due diligence</strong>
• Visit the premises in person before committing
• Speak with key employees and customers where possible
• Assess management depth and key-person risk

<strong>Regulatory compliance</strong>
• Verify all relevant licences, certifications, and tax filings are current
• For acquisitions, engage a legal advisor familiar with SECP and FBR requirements

All figures displayed on Finvest are self-reported by listing owners and have not been independently verified. Do not rely solely on information presented on this platform.`,
  },
]

const CATEGORIES = [...new Set(FAQS.map((f) => f.category))]

export default async function FaqPage() {
  const auth = await getAuthUser()

  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <Navbar user={auth as any} />

      {/* Hero */}
      <section className="relative px-4 py-20 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full pointer-events-none"
             style={{ filter: 'blur(100px)', background: 'rgba(107,33,168,0.2)' }} />
        <div className="relative max-w-xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-3">Help Centre</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-fg-2 text-base">
            Everything you need to know about using Finvest — from creating an account to conducting due diligence.
          </p>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="py-8 px-4 page-container pb-20">
        <div className="max-w-3xl mx-auto">
          <FaqAccordion items={FAQS} categories={CATEGORIES} />
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-4 pb-12">
        <div className="page-container max-w-3xl mx-auto">
          <div className="rounded-2xl p-5"
               style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              <span className="font-semibold text-amber-400">⚠ Legal Disclaimer: </span>
              Finvest only facilitates connections between parties. We do not provide financial advice,
              handle funds, or guarantee any transactions or investments. Users are solely responsible
              for their own due diligence. All financial figures displayed are self-reported by listing owners.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
