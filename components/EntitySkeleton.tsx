'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function EntitySkeleton({}: { title: string }) {
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40" /> {/* Title */}
        <Skeleton className="h-9 w-28 rounded-md" /> {/* Add Button */}
      </div>

      {/* Tabs */}
      <div className="flex gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16" />
        ))}
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 gap-4 border-b pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-24" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid grid-cols-6 gap-4 items-center">
            {Array.from({ length: 6 }).map((_, col) => (
              <Skeleton key={col} className="h-5 w-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
