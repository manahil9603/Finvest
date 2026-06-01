import Link from 'next/link'

const LINKS = {
  Platform: [
    { href: '/explore',      label: 'Browse Listings' },
    { href: '/listings/new', label: 'List Your Business' },
    { href: '/about',        label: 'How It Works' },
    { href: '/register',     label: 'Join Finvest' },
  ],
  Company: [
    { href: '/about',   label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/blog',    label: 'Blog' },
    { href: '/careers', label: 'Careers' },
  ],
  Legal: [
    { href: '/terms',      label: 'Terms of Service' },
    { href: '/privacy',    label: 'Privacy Policy' },
    { href: '/disclaimer', label: 'Disclaimer' },
    { href: '/cookies',    label: 'Cookie Policy' },
  ],
}

export function Footer() {
  return (
    <footer className="mt-auto border-t footer-edge">
      {/* Legal disclaimer — always prominent at the very top of footer */}
      <div className="legal-strip px-4 py-3.5 text-center text-xs leading-relaxed">
        <span>
          <strong className="font-semibold">⚠ Legal Disclaimer: </strong>
        </span>
        <span>
          Finvest only facilitates connections between parties. We do not provide financial advice,
          handle funds, or guarantee any transactions or investments. Users are solely responsible
          for their own due diligence. All financial figures are self-reported and unverified.
        </span>
      </div>

      {/* Main footer body */}
      <div className="page-container py-14 footer-bg-fade">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-8">

          {/* Brand column */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}
              >
                <span className="font-black text-white text-base">F</span>
              </div>
              <span
                className="font-display font-black text-xl tracking-tight bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #8B5CF6)' }}
              >
                Finvest
              </span>
            </Link>

            <p className="text-sm text-fg-2 leading-relaxed max-w-xs">
              Pakistan&apos;s premier SME marketplace. Connecting entrepreneurs, investors,
              and acquirers across all 7 provinces — no middlemen, no commissions.
            </p>

            <div className="flex items-center gap-2 mt-5">
              <span className="text-sm">🇵🇰</span>
              <span className="text-xs font-semibold text-fg-3 uppercase tracking-widest">
                Built for Pakistan
              </span>
            </div>

            {/* Stats pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { label: '7 Provinces', color: 'rgba(139,92,246,0.15)', text: '#A78BFA' },
                { label: '15 Industries', color: 'rgba(16,185,129,0.12)', text: '#34D399' },
                { label: '0% Commission', color: 'rgba(59,130,246,0.12)', text: '#60A5FA' },
              ].map((s) => (
                <span
                  key={s.label}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: s.color, color: s.text }}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-4">
                {section}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-fg-2 hover:text-foreground transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/12">
          <p className="text-xs text-fg-3">
            © {new Date().getFullYear()} Finvest Pakistan. All rights reserved.
          </p>
          <p className="text-xs text-fg-3">
            Not a registered financial institution. Not SECP regulated.
          </p>
        </div>
      </div>
    </footer>
  )
}
