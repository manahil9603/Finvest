import type { NextConfig } from 'next'
import path from 'path'

// ── Content-Security-Policy ───────────────────────────────────────────────────
// Keep 'connect-src' aligned with the app URL because Socket.io shares the Next.js port.
//
// Do NOT send `upgrade-insecure-requests` during local `next dev` over http://localhost:
// browsers may try to load `/_next/static/chunks/*` over HTTPS and chunk loads time out
// (ChunkLoadError). Keep that directive for production builds only.
function toWebSocketUrl(url: string | undefined) {
  return url?.replace(/\/$/, '').replace(/^http/, 'ws') ?? ''
}

function normalizeUrl(url: string | undefined) {
  return url?.replace(/\/$/, '') ?? ''
}

function buildContentSecurityPolicy() {
  const appUrl = process.env.NEXTAUTH_URL
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
  const directives = [
    "default-src 'self'",
    // Next.js needs unsafe-eval for dev fast-refresh; restrict in prod if possible
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    // Next.js API + Socket.io server (ws/wss for WebSocket)
    [
      "connect-src 'self'",
      'http://localhost:3000',
      'ws://localhost:3000',
      'http://127.0.0.1:3000',
      'ws://127.0.0.1:3000',
      normalizeUrl(appUrl),
      toWebSocketUrl(appUrl),
      normalizeUrl(socketUrl),
      toWebSocketUrl(socketUrl),
    ]
      .filter(Boolean)
      .join(' '),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ]
  if (process.env.NODE_ENV === 'production') {
    directives.push('upgrade-insecure-requests')
  }
  return directives.join('; ')
}

const csp = buildContentSecurityPolicy()

const nextConfig: NextConfig = {
  // Hide the Next.js dev badge (bottom-left "N" indicator) in development
  devIndicators: false,

  // ── Image domains ──────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },

  // ── External packages (Prisma requires native binaries) ────────────────────
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],

  /**
   * Webpack can pick the `browser` export of `@prisma/client` for some server chunks, which loads
   * the stub client (no `jobPosting` / no real engine). Force the Node entry + package conditions.
   */
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve ??= {}
      config.resolve.conditionNames = ['node', 'require', 'import', 'default']
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client$': path.join(process.cwd(), 'node_modules', '@prisma', 'client', 'default.js'),
      }
    }
    return config
  },

  // ── Response headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control',  value: 'on'                              },
          { key: 'X-Frame-Options',         value: 'SAMEORIGIN'                      },
          { key: 'X-Content-Type-Options',  value: 'nosniff'                         },
          { key: 'X-XSS-Protection',        value: '1; mode=block'                   },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Content-Security-Policy', value: csp                               },
        ],
      },
      {
        // API routes — no caching, no store
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma',        value: 'no-cache'                                              },
          { key: 'Expires',       value: '0'                                                     },
        ],
      },
    ]
  },

  // ── Redirects ──────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Legacy /register → /signup
      { source: '/register', destination: '/signup', permanent: true },
      { source: '/listings', destination: '/explore', permanent: false },
    ]
  },
}

export default nextConfig
