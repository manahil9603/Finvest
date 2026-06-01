import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'circle' | 'rect' | 'card'
  width?:   string | number
  height?:  string | number
  lines?:   number   // for variant='line', render N stacked lines
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  lines,
  className,
  style,
  ...props
}: SkeletonProps) {
  const base = 'skeleton'

  if (variant === 'circle') {
    const size = width ?? height ?? 40
    return (
      <div
        className={cn(base, className)}
        style={{ width: size, height: size, borderRadius: '50%', ...style }}
        aria-hidden="true"
        {...props}
      />
    )
  }

  if (variant === 'line') {
    const count = lines ?? 1
    return (
      <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={base}
            style={{
              height: height ?? 14,
              width: i === count - 1 && count > 1 ? '60%' : (width ?? '100%'),
              ...style,
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={cn('card p-6 flex flex-col gap-4', className)}
        aria-hidden="true"
        {...props}
      >
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" width={40} />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton variant="line" height={12} width="55%" />
            <Skeleton variant="line" height={10} width="35%" />
          </div>
        </div>
        <Skeleton variant="line" lines={3} height={12} />
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Skeleton variant="rect" height={56} className="rounded-xl" />
          <Skeleton variant="rect" height={56} className="rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(base, className)}
      style={{ width: width ?? '100%', height: height ?? 16, ...style }}
      aria-hidden="true"
      {...props}
    />
  )
}

// ── Preset composites ──────────────────────────────────────────────────────────

export function SkeletonListingCard() {
  return (
    <div className="card p-0 overflow-hidden" aria-hidden="true">
      <div className="h-1.5 skeleton" />
      <div className="p-5 flex flex-col gap-4">
        <div className="flex gap-2">
          <Skeleton variant="rect" width={90} height={22} className="rounded-full" />
          <Skeleton variant="rect" width={70} height={22} className="rounded-full" />
        </div>
        <Skeleton variant="line" height={18} />
        <Skeleton variant="line" height={14} width="60%" />
        <Skeleton variant="line" lines={2} height={12} />
        <div className="grid grid-cols-2 gap-3 mt-1">
          <Skeleton variant="rect" height={60} className="rounded-xl" />
          <Skeleton variant="rect" height={60} className="rounded-xl" />
        </div>
        <div className="flex justify-between mt-1">
          <Skeleton variant="line" height={11} width={80} />
          <Skeleton variant="line" height={11} width={50} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonProfileRow() {
  return (
    <div className="flex items-center gap-4 p-4" aria-hidden="true">
      <Skeleton variant="circle" width={48} />
      <div className="flex-1">
        <Skeleton variant="line" height={14} width="40%" />
        <Skeleton variant="line" height={11} width="25%" style={{ marginTop: 6 }} />
      </div>
      <Skeleton variant="rect" width={80} height={32} className="rounded-xl" />
    </div>
  )
}
