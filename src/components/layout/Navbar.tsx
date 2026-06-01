'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'
/** Server passes JWT ({ email, role, … }); some pages pass a DB User slice — handle both */
export type NavbarUser = {
  role: string
  name?: string | null
  email?: string | null
  verified?: boolean
}

interface NavbarProps {
  user?: NavbarUser | null
}

function navDisplayLabel(u: NavbarUser): string {
  const n = u.name?.trim()
  if (n) return n
  const local = u.email?.split('@')[0]?.trim()
  if (local) return local
  return 'User'
}

function navFirstLabel(u: NavbarUser): string {
  return navDisplayLabel(u).split(/\s+/)[0] ?? 'User'
}

const NAV_LINKS = [
  { href: '/explore', label: 'Browse' },
  { href: '/about',   label: 'How It Works' },
]

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="Finvest home">
      {/* Icon mark */}
      <div className="relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}>
        <span className="relative z-10 font-black text-white text-sm tracking-tight">F</span>
        {/* Inner shimmer on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
             style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />
      </div>

      {/* Wordmark */}
      <span
        className="font-display font-black text-xl tracking-tight bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #8B5CF6, #6B21A8)' }}
      >
        Finvest
      </span>

      {/* Country chip */}
      <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-fg-3 border-l border-border/20 pl-2.5">
        🇵🇰 <span>PK</span>
      </span>
    </Link>
  )
}

// ── Desktop nav link ──────────────────────────────────────────────────────────

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'relative px-3 py-1.5 text-sm font-medium rounded-xl transition-all duration-200',
        active
          ? 'text-foreground'
          : 'text-fg-2 hover:text-foreground hover:bg-surface/10'
      )}
    >
      {label}
      {/* Active underline */}
      {active && (
        <span
          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, #6B21A8, #8B5CF6)' }}
        />
      )}
    </Link>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ label }: { label: string }) {
  const ch = label.trim().charAt(0)
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
      style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}
      aria-hidden="true"
    >
      {(ch || '?').toUpperCase()}
    </div>
  )
}

// ── Mobile menu icon ──────────────────────────────────────────────────────────

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="w-5 flex flex-col gap-1.5 items-end" aria-hidden="true">
      <span className={cn('block h-0.5 rounded-full bg-current transition-all duration-300 origin-center',
        open ? 'w-5 rotate-45 translate-y-2' : 'w-5')} />
      <span className={cn('block h-0.5 rounded-full bg-current transition-all duration-300',
        open ? 'w-0 opacity-0' : 'w-3.5')} />
      <span className={cn('block h-0.5 rounded-full bg-current transition-all duration-300 origin-center',
        open ? 'w-5 -rotate-45 -translate-y-2' : 'w-5')} />
    </div>
  )
}

// ── Main Navbar ───────────────────────────────────────────────────────────────

export function Navbar({ user }: NavbarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [scrolled,  setScrolled]  = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Scroll sentinel — increases glass opacity after user scrolls 20px
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    handler() // init
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Close user menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUserMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300',
          scrolled || menuOpen
            ? 'border-b'
            : 'border-b border-transparent'
        )}
        style={
          scrolled || menuOpen
            ? {
                background: 'rgb(var(--nav-bg-scrolled) / var(--nav-bg-scrolled-a))',
                backdropFilter: 'blur(28px) saturate(200%)',
                WebkitBackdropFilter: 'blur(28px) saturate(200%)',
                borderBottomColor: 'rgb(var(--nav-border) / var(--nav-border-a))',
              }
            : {
                background: 'rgb(var(--nav-bg) / var(--nav-bg-a))',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }
        }
      >
        <div className="page-container">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* ── Left: Logo ───────────────────────────────── */}
            <Logo />

            {/* ── Center: Nav links (desktop) ──────────────── */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <NavLink key={l.href} {...l} active={pathname === l.href} />
              ))}
            </div>

            {/* ── Right: Actions ───────────────────────────── */}
            <div className="flex items-center gap-2">
              <ThemeToggle size="sm" className="hidden sm:flex" />

              {user ? (
                /* Logged-in state */
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/listings/new"
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold',
                      'border transition-all duration-200',
                      'text-brand-purple-light border-brand-purple/30 hover:border-brand-purple hover:bg-brand-purple/10'
                    )}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    List Business
                  </Link>

                  {/* User menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className={cn(
                        'flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl transition-all duration-200',
                        'border hover:bg-surface/10',
                        userMenuOpen ? 'border-border/20 bg-surface/10' : 'border-transparent'
                      )}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
                    >
                      <Avatar label={navDisplayLabel(user)} />
                      <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
                        {navFirstLabel(user)}
                      </span>
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
                        className={cn('text-fg-3 transition-transform duration-200', userMenuOpen && 'rotate-180')}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {userMenuOpen && (
                      <div
                        className={cn(
                          'absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden',
                          'glass-strong shadow-glass border',
                          'animate-fade-down'
                        )}
                        style={{ borderColor: 'rgb(var(--border) / 0.12)' }}
                        role="menu"
                      >
                        <div className="px-4 py-3 border-b border-border/15">
                          <p className="text-xs font-semibold text-foreground truncate">{navDisplayLabel(user)}</p>
                          <p className="text-[11px] text-fg-3 mt-0.5">{user.role.replace('_', ' ')}</p>
                        </div>

                        {[
                          { href: '/dashboard', label: 'Dashboard', icon: '◈' },
                          { href: '/profile',   label: 'Profile',   icon: '◉' },
                          { href: '/messages',  label: 'Messages',  icon: '◎' },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-fg-2 hover:text-foreground hover:bg-surface/10 transition-colors"
                          >
                            <span className="text-brand-purple text-xs">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}

                        <div className="border-t border-border/15 my-1" />

                        <button
                          onClick={logout}
                          role="menuitem"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <span className="text-xs">⊗</span>
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Logged-out state */
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-fg-2 hover:text-foreground rounded-xl hover:bg-surface/10 transition-all duration-200"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
                      boxShadow: '0 4px 15px rgba(107,33,168,0.4)',
                    }}
                  >
                    Get Started
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-xl text-fg-2 hover:text-foreground hover:bg-surface/10 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
              >
                <HamburgerIcon open={menuOpen} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu panel ─────────────────────────────── */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
            menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="page-container pb-6 pt-2 flex flex-col gap-1">
            {/* Nav links */}
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'flex items-center py-3 px-3 rounded-xl text-sm font-medium transition-colors',
                  pathname === l.href
                    ? 'text-brand-purple bg-brand-purple/10'
                    : 'text-fg-2 hover:text-foreground hover:bg-surface/10'
                )}
              >
                {l.label}
              </Link>
            ))}

            <div className="my-2 divider" />

            {/* Theme toggle row */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-fg-2">Appearance</span>
              <ThemeToggle />
            </div>

            {user ? (
              <>
                <div className="my-1 divider" />
                <div className="px-3 py-2 flex items-center gap-3">
                  <Avatar label={navDisplayLabel(user)} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{navDisplayLabel(user)}</p>
                    <p className="text-xs text-fg-3">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>
                {[
                  { href: '/dashboard',   label: 'Dashboard' },
                  { href: '/profile',     label: 'Profile' },
                  { href: '/messages',    label: 'Messages' },
                  { href: '/listings/new', label: '+ List Business' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="py-3 px-3 text-sm text-fg-2 hover:text-foreground hover:bg-surface/10 rounded-xl transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="text-left py-3 px-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors mt-1"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <div className="my-1 divider" />
                <Link
                  href="/login"
                  className="py-3 px-3 text-sm text-fg-2 hover:text-foreground hover:bg-surface/10 rounded-xl transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="mt-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }}
                >
                  Create Account
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer so content doesn't hide behind fixed nav */}
      <div className="h-16" aria-hidden="true" />
    </>
  )
}
