import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { LoadingProvider } from '@/components/providers/LoadingProvider'
import { ToastProvider, Toaster } from '@/components/ui/Toast'

// ── Fonts ──────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

const poppins = Poppins({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display:  'swap',
})

// ── SEO metadata ───────────────────────────────────────────────────────────────

const SITE_NAME = 'Finvest Pakistan'
const SITE_URL  = process.env.NEXTAUTH_URL ?? 'https://finvest.pk'
const SITE_DESC =
  "Pakistan's leading SME investment and acquisition marketplace. " +
  'Connect verified businesses with investors and buyers across all 7 provinces — no middlemen, no commission.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:  'Finvest – Pakistan SME Investment & Acquisition Marketplace',
    template: '%s | Finvest',
  },

  description: SITE_DESC,

  keywords: [
    'Pakistan investment', 'SME marketplace', 'business acquisition Pakistan',
    'investor network Pakistan', 'startup funding Pakistan', 'Finvest',
    'buy business Pakistan', 'sell business Pakistan', 'Pakistani entrepreneurs',
  ],

  authors:    [{ name: 'Finvest Pakistan', url: SITE_URL }],
  creator:    'Finvest Pakistan',
  publisher:  'Finvest Pakistan',

  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },

  // ── Open Graph ───────────────────────────────────────────────────────────────
  openGraph: {
    type:        'website',
    locale:      'en_PK',
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       'Finvest – Pakistan SME Investment Marketplace',
    description: SITE_DESC,
    images: [
      {
        url:    '/og-image.png',   // place a 1200×630 image in /public
        width:  1200,
        height: 630,
        alt:    'Finvest — Pakistan SME Investment Platform',
      },
    ],
  },

  // ── Twitter / X ──────────────────────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    site:        '@FinvestPK',
    creator:     '@FinvestPK',
    title:       'Finvest – Pakistan SME Investment Marketplace',
    description: SITE_DESC,
    images:      ['/og-image.png'],
  },

  // ── Manifest & icons ─────────────────────────────────────────────────────────
  manifest:  '/manifest.json',
  icons: {
    icon:     '/favicon.ico',
    shortcut: '/favicon-32x32.png',
    apple:    '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor:    '#0F0F0F',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  5,
}

// ── Root layout ────────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning               // required: theme script changes class before hydration
      className={`${inter.variable} ${poppins.variable}`}
    >
      <head>
        {/*
          Inline script runs synchronously before React hydrates.
          It restores the saved theme to prevent a flash of wrong theme.
          Dark is the default (no class needed); light mode adds `.light`.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('finvest-theme')==='light')document.documentElement.classList.add('light')}catch(e){}})();`,
          }}
        />
      </head>

      <body className="bg-background text-foreground antialiased min-h-dvh">
        {/* ── Skip navigation (accessibility) ─────────────────────────────── */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-semibold focus:text-white"
          style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}
        >
          Skip to main content
        </a>

        <ThemeProvider>
          <LoadingProvider>
            <ToastProvider>
              {children}
              <Toaster />
            </ToastProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
