import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type CardVariant = 'glass' | 'solid' | 'outline' | 'ghost'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  lift?:    boolean   // subtle translateY on hover
  glow?:    boolean   // purple glow on hover
  noPad?:   boolean   // skip default padding
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantStyles: Record<CardVariant, string> = {
  glass: 'card',
  solid: [
    'rounded-3xl border transition-all duration-200',
    'bg-bg-secondary border-border/20',
    'hover:border-border/30',
  ].join(' '),
  outline: [
    'rounded-3xl border transition-all duration-200',
    'bg-transparent border-border/15',
    'hover:border-brand-purple/40 hover:bg-surface/5',
  ].join(' '),
  ghost: 'rounded-3xl transition-all duration-200 hover:bg-surface/5',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-5', className)} {...props} />
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-display text-lg font-bold tracking-tight text-foreground', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-fg-2 mt-1 leading-relaxed', className)} {...props} />
}

function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1', className)} {...props} />
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-5 pt-4 flex items-center gap-3', className)}
      style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      {...props}
    />
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'glass', lift = false, glow = false, noPad = false, className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        variantStyles[variant],
        !noPad && 'p-6',
        lift && 'card-lift',
        glow && 'hover:shadow-neon-purple',
        'flex flex-col',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter }
