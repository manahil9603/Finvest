export function BusinessSkeleton() {
  return (
    <div
      className="rounded-3xl overflow-hidden flex flex-col"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Banner */}
      <div className="h-36 skeleton" />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Badges */}
        <div className="flex gap-2">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>

        {/* Title */}
        <div className="skeleton h-5 w-4/5 rounded-lg" />
        <div className="skeleton h-4 w-2/5 rounded-lg" />

        {/* Financials */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="skeleton h-14 rounded-2xl" />
          <div className="skeleton h-14 rounded-2xl" />
        </div>

        {/* Highlights */}
        <div className="flex gap-2 mt-1">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-5 w-24 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-auto pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <div className="skeleton w-7 h-7 rounded-xl" />
            <div className="skeleton h-4 w-24 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton w-9 h-9 rounded-xl" />
            <div className="skeleton w-24 h-9 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <BusinessSkeleton key={i} />
      ))}
    </div>
  )
}
