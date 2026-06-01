import { forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'neon' | 'blue' | 'danger' | 'outline'
export type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface BaseButtonProps {
  variant?:   ButtonVariant
  size?:      ButtonSize
  loading?:   boolean
  fullWidth?: boolean
  leftIcon?:  ReactNode
  rightIcon?: ReactNode
  children?:  ReactNode
  className?: string
}

type ButtonAsButton  = BaseButtonProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button'; href?: never }
type ButtonAsLink    = BaseButtonProps & { as: 'link'; href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
type ButtonProps     = ButtonAsButton | ButtonAsLink

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantClass: Record<ButtonVariant, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  neon:      'btn-neon',
  blue:      'btn-blue',
  danger:    'btn-danger',
  outline: [
    'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl',
    'transition-all duration-200 select-none cursor-pointer',
    'bg-transparent border text-foreground',
    'border-brand-purple/40 hover:border-brand-purple hover:bg-brand-purple/10',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/60',
  ].join(' '),
}

const sizeClass: Record<ButtonSize, string> = {
  xs: 'px-3   py-1.5 text-xs',
  sm: 'px-3.5 py-2   text-xs',
  md: 'px-5   py-2.5 text-sm',
  lg: 'px-7   py-3.5 text-base',
  xl: 'px-9   py-4   text-lg',
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant   = 'primary',
      size      = 'md',
      loading   = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className,
      ...rest
    } = props

    const classes = cn(
      variantClass[variant],
      sizeClass[size],
      fullWidth && 'w-full',
      className
    )

    const inner = (
      <>
        {loading ? <Spinner /> : leftIcon}
        {children && <span>{children}</span>}
        {!loading && rightIcon}
      </>
    )

    if (props.as === 'link') {
      const { href, as: _as, ...linkRest } = rest as ButtonAsLink & { href: string }
      return (
        <Link href={href} className={classes} {...(linkRest as any)}>
          {inner}
        </Link>
      )
    }

    const { as: _as, ...btnRest } = rest as ButtonAsButton
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        disabled={(btnRest as ButtonHTMLAttributes<HTMLButtonElement>).disabled || loading}
        {...(btnRest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {inner}
      </button>
    )
  }
)

Button.displayName = 'Button'
