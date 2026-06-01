import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // We use a custom `.light` class (not `.dark`) because dark is the default.
  // `darkMode: 'class'` is kept for any third-party component compatibility.
  darkMode: 'class',
  theme: {
    extend: {
      // ── Semantic colours (backed by CSS variables) ──────────
      // All support Tailwind opacity modifiers: bg-background/50, text-foreground/60, etc.
      colors: {
        background:    'rgb(var(--bg)            / <alpha-value>)',
        'bg-secondary':'rgb(var(--bg-secondary)  / <alpha-value>)',
        surface:       'rgb(var(--surface)       / <alpha-value>)',
        'surface-high':'rgb(var(--surface-high)  / <alpha-value>)',
        border:        'rgb(var(--border)        / <alpha-value>)',
        'border-strong':'rgb(var(--border-strong)/ <alpha-value>)',
        foreground:    'rgb(var(--fg)            / <alpha-value>)',
        'fg-2':        'rgb(var(--fg-2)          / <alpha-value>)',
        'fg-3':        'rgb(var(--fg-3)          / <alpha-value>)',

        // ── Brand palette ──────────────────────────────────
        brand: {
          purple:       '#8B5CF6',
          'purple-deep':'#6B21A8',
          'purple-mid': '#7C3AED',
          'purple-light':'#A78BFA',
          'purple-pale': '#EDE9FE',
          green:        '#10B981',
          'green-dark': '#059669',
          'green-glow': '#34D399',
          blue:         '#3B82F6',
          'blue-dark':  '#2563EB',
          'blue-glow':  '#60A5FA',
        },

        // ── Status ─────────────────────────────────────────
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#3B82F6',
      },

      // ── Background images & gradients ────────────────────
      backgroundImage: {
        'brand-gradient':       'linear-gradient(135deg, #6B21A8 0%, #8B5CF6 100%)',
        'brand-gradient-r':     'linear-gradient(135deg, #8B5CF6 0%, #6B21A8 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
        'neon-gradient':        'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        'blue-gradient':        'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
        'glass-surface':        'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'glass-surface-light':  'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.75) 100%)',
        // Ambient orb used behind hero sections
        'hero-glow':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.35) 0%, transparent 70%)',
        'shimmer':
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
        'shimmer-light':
          'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 50%, transparent 100%)',
      },

      // ── Typography ───────────────────────────────────────
      fontFamily: {
        sans:    ['var(--font-inter)',    'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)',  'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // ── Border radius ────────────────────────────────────
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',   // primary card radius
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // ── Shadows ──────────────────────────────────────────
      boxShadow: {
        glass:         '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-hover': '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-light': '0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
        'glass-light-hover': '0 8px 40px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        'neon-purple': '0 0 24px rgba(139,92,246,0.45), 0 0 48px rgba(139,92,246,0.20)',
        'neon-green':  '0 0 24px rgba(16,185,129,0.45), 0 0 48px rgba(16,185,129,0.20)',
        'neon-blue':   '0 0 24px rgba(59,130,246,0.45), 0 0 48px rgba(59,130,246,0.20)',
        'inner-glow':  'inset 0 0 40px rgba(139,92,246,0.08)',
        'brand-button':'0 4px 15px rgba(107,33,168,0.4)',
        'brand-button-hover':'0 6px 25px rgba(107,33,168,0.6)',
      },

      // ── Animations ───────────────────────────────────────
      animation: {
        'shimmer':     'shimmer 1.8s linear infinite',
        'fade-in':     'fadeIn 0.25s ease-out',
        'fade-up':     'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-down':   'fadeDown 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-down':  'slideDown 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-left':  'slideLeft 0.35s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':    'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'spin-slow':   'spin 3s linear infinite',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'glow-pulse':  'glowPulse 2.5s ease-in-out infinite',
        'toast-in':    'toastIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        'toast-out':   'toastOut 0.25s ease-in forwards',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        fadeIn:  {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeUp:  {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp:  {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 20px rgba(139,92,246,0.3)' },
          '50%':     { boxShadow: '0 0 40px rgba(139,92,246,0.6)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateX(110%) scale(0.95)' },
          to:   { opacity: '1', transform: 'translateX(0)   scale(1)' },
        },
        toastOut: {
          from: { opacity: '1', transform: 'translateX(0)   scale(1)' },
          to:   { opacity: '0', transform: 'translateX(110%) scale(0.95)' },
        },
      },

      // ── Breakpoints ──────────────────────────────────────
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}

export default config
