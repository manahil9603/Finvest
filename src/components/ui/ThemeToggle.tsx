'use client'
import { useTheme } from '@/components/providers/ThemeProvider'

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md'
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const dim = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${dim} rounded-xl flex items-center justify-center
        transition-all duration-200
        text-fg-2 hover:text-foreground
        bg-surface/10 hover:bg-surface/20
        border border-border/10 hover:border-border/20
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50
        ${className}
      `}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        className="transition-all duration-300"
        style={{ transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)' }}
      >
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  )
}
