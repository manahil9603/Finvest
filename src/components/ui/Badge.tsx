import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'purple' | 'green' | 'blue' | 'amber' | 'red' | 'gray'
  | 'purple-outline' | 'green-outline' | 'blue-outline'
  | 'gradient'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?:     boolean  // coloured dot prefix
  size?:    'sm' | 'md'
}

const styles: Record<BadgeVariant, string> = {
  purple:
    'bg-brand-purple/15 text-brand-purple-light border border-brand-purple/20',
  green:
    'bg-brand-green/15 text-brand-green-glow border border-brand-green/20',
  blue:
    'bg-brand-blue/15 text-brand-blue-glow border border-brand-blue/20',
  amber:
    'bg-amber-400/15 text-amber-300 border border-amber-400/20',
  red:
    'bg-red-500/15 text-red-400 border border-red-500/20',
  gray:
    'bg-surface/20 text-fg-2 border border-border/15',
  'purple-outline':
    'bg-transparent text-brand-purple border border-brand-purple/50',
  'green-outline':
    'bg-transparent text-brand-green border border-brand-green/50',
  'blue-outline':
    'bg-transparent text-brand-blue border border-brand-blue/50',
  gradient:
    'text-white border-0',
}

const dotColors: Record<BadgeVariant, string> = {
  purple:          'bg-brand-purple',
  green:           'bg-brand-green',
  blue:            'bg-brand-blue',
  amber:           'bg-amber-400',
  red:             'bg-red-500',
  gray:            'bg-fg-3',
  'purple-outline': 'bg-brand-purple',
  'green-outline':  'bg-brand-green',
  'blue-outline':   'bg-brand-blue',
  gradient:         'bg-white',
}

export function Badge({
  variant = 'gray',
  dot = false,
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  const isGradient = variant === 'gradient'

  return (
    <span
      className={cn(
        'badge',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        styles[variant],
        className
      )}
      style={
        isGradient
          ? { background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)' }
          : undefined
      }
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}

// ── Preset badges for common listing/domain concepts ──────────

export function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    INVESTMENT:  { label: 'Investment',  variant: 'blue' },
    ACQUISITION: { label: 'Acquisition', variant: 'purple' },
    PARTNERSHIP: { label: 'Partnership', variant: 'amber' },
  }
  const cfg = map[type] ?? { label: type, variant: 'gray' as BadgeVariant }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    IDEA:      { label: 'Idea',      variant: 'gray' },
    STARTUP:   { label: 'Startup',   variant: 'blue' },
    GROWING:   { label: 'Growing',   variant: 'green' },
    EXPANDING: { label: 'Expanding', variant: 'purple' },
    MATURE:    { label: 'Mature',    variant: 'amber' },
  }
  const cfg = map[stage] ?? { label: stage, variant: 'gray' as BadgeVariant }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    ACTIVE:  { label: 'Active',  variant: 'green' },
    DRAFT:   { label: 'Draft',   variant: 'gray' },
    CLOSED:  { label: 'Closed',  variant: 'red' },
    PENDING: { label: 'Pending', variant: 'amber' },
  }
  const cfg = map[status] ?? { label: status, variant: 'gray' as BadgeVariant }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    BUSINESS_OWNER: { label: 'Business Owner', variant: 'amber' },
    INVESTOR:       { label: 'Investor',        variant: 'green' },
    BUYER:          { label: 'Buyer',           variant: 'blue' },
    ADMIN:          { label: 'Admin',           variant: 'purple' },
  }
  const cfg = map[role] ?? { label: role, variant: 'gray' as BadgeVariant }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
