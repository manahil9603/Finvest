import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EMPLOYMENT_LABELS } from '@/lib/jobs-display'

export const metadata: Metadata = {
  title: 'Careers | Finvest Pakistan',
  description: 'Join the team building trusted SME investing and acquisitions in Pakistan.',
}

export default async function CareersPage() {
  const auth = await getAuthUser()

  const postings = await prisma.jobPosting.findMany({
    where:   { active: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id:             true,
      title:          true,
      department:     true,
      location:       true,
      description:    true,
      employmentType: true,
      applyEmail:     true,
    },
  })

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Disclaimer />
      <Navbar user={auth} />

      <main id="main-content" className="flex-1 page-container py-12 sm:py-16">
        <header className="max-w-2xl mb-10 sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-purple-light mb-2">
            Work with us
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-foreground mb-3">
            Careers
          </h1>
          <p className="text-fg-2 leading-relaxed">
            Help connect serious investors with growing businesses across Pakistan. We hire thoughtfully and
            value clarity, judgement, and respect for SMEs.
          </p>
          {auth?.role === 'ADMIN' && (
            <p className="mt-4 text-sm">
              <Link
                href="/admin/jobs"
                className="font-semibold text-brand-purple-light underline-offset-4 hover:underline"
              >
                Manage job postings
              </Link>
              <span className="text-fg-3"> (admin)</span>
            </p>
          )}
        </header>

        {postings.length === 0 ? (
          <section
            className="rounded-3xl px-8 py-14 text-center panel-elevated max-w-xl mx-auto sm:mx-0"
            aria-live="polite"
          >
            <p className="text-lg font-semibold text-foreground mb-2">
              Sorry, there are no open positions right now.
            </p>
            <p className="text-sm text-fg-2 leading-relaxed">
              We appreciate your interest in Finvest. Check back soon, or browse listings and connect through
              the platform instead.
            </p>
            <Link
              href="/explore"
              className="inline-flex mt-6 items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-br from-[#6B21A8] to-[#8B5CF6] shadow-brand-button hover:opacity-95 transition-opacity"
            >
              Explore businesses
            </Link>
          </section>
        ) : (
          <ul className="grid gap-4 max-w-3xl">
            {postings.map((job) => {
              const typeLabel = EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType
              const applyHref = job.applyEmail?.trim()
                ? `mailto:${job.applyEmail.trim()}?subject=${encodeURIComponent(`Application: ${job.title}`)}`
                : null
              return (
                <li key={job.id}>
                  <article className="panel-elevated rounded-3xl p-6 sm:p-8 transition-transform hover:-translate-y-0.5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <h2 className="font-display font-bold text-xl text-foreground leading-snug">{job.title}</h2>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-purple/15 text-brand-purple-light shrink-0">
                        {typeLabel}
                      </span>
                    </div>
                    <p className="text-sm text-fg-3 mb-4">
                      {job.department && <span className="text-fg-2 font-medium">{job.department}</span>}
                      {job.department && ' · '}
                      {job.location}
                    </p>
                    <div className="text-sm text-fg-2 whitespace-pre-wrap leading-relaxed mb-6">{job.description}</div>
                    {applyHref ? (
                      <a
                        href={applyHref}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-br from-[#6B21A8] to-[#8B5CF6] hover:opacity-95 transition-opacity"
                      >
                        Apply by email
                      </a>
                    ) : (
                      <p className="text-xs text-fg-3">
                        Applications are coordinated through general outreach — mention the role title in your
                        message via our{' '}
                        <Link href="/contact" className="text-brand-purple-light font-semibold hover:underline">
                          contact options
                        </Link>
                        .
                      </p>
                    )}
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  )
}
