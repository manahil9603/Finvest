import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { getAuthUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Blog | Finvest Pakistan',
  description:
    'Insights on SME investing, acquisitions, and entrepreneurship across Pakistan.',
}

/** Placeholder posts until a CMS or MD pipeline is wired up */
const PLACEHOLDER_POSTS = [
  {
    slug: 'due-diligence-sme-acquisitions-pakistan',
    title: 'Due diligence essentials for SME acquisitions in Pakistan',
    excerpt:
      'A practical checklist for buyers reviewing financials, regulatory filings, and operational risk before closing a Pakistani SME deal.',
    date: '2026 · Coming soon',
  },
  {
    slug: 'structuring-investments-founders-guide',
    title: 'Structuring angel and seed investments: a founder-facing guide',
    excerpt:
      'How equity rounds, safe notes, and revenue-based structures are increasingly discussed among Pakistani founders and angels.',
    date: '2026 · Coming soon',
  },
  {
    slug: 'sme-valuation-methods',
    title: 'Valuation lenses for SMEs — revenue, EBITDA, and comparables',
    excerpt:
      'Why listed-company multiples rarely apply directly, and what investors look for instead in owner-led businesses.',
    date: '2026 · Coming soon',
  },
]

export default async function BlogPage() {
  const auth = await getAuthUser()

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Disclaimer />
      <Navbar user={auth} />

      <main id="main-content" className="flex-1 page-container py-12 sm:py-16">
        <header className="max-w-2xl mb-10 sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-purple-light mb-2">
            Finvest Journal
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-3">
            Blog
          </h1>
          <p className="text-fg-2 leading-relaxed">
            Stories on SME investing, exits, and building businesses across Pakistan. Full articles are
            being prepared — bookmark this page or follow our listings for updates.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_POSTS.map((post) => (
            <li key={post.slug}>
              <article className="panel-elevated h-full rounded-3xl p-6 flex flex-col transition-transform hover:-translate-y-0.5">
                <time className="text-[11px] font-semibold uppercase tracking-wider text-fg-3 mb-2">
                  {post.date}
                </time>
                <h2 className="font-display font-bold text-lg text-foreground leading-snug mb-2 flex-1">
                  {post.title}
                </h2>
                <p className="text-sm text-fg-2 leading-relaxed mb-4">{post.excerpt}</p>
                <span className="text-xs font-semibold text-brand-purple-light">Article in progress →</span>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-3xl panel-elevated p-8 text-center">
          <p className="text-foreground font-semibold mb-2">Want opportunities, not articles?</p>
          <p className="text-fg-2 text-sm mb-5 max-w-md mx-auto">
            Browse verified businesses seeking investment or acquisition on Finvest.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-br from-[#6B21A8] to-[#8B5CF6] shadow-brand-button hover:opacity-95 transition-opacity"
          >
            Explore listings
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
