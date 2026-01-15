'use client'

import { Card, CardContent } from '@/components/ui/card'

export default function CardSkeleton() {
  return (
    <Card className="p-0 relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* Image Shimmer */}
      <div className="relative h-[250px] w-full overflow-hidden bg-gray-200">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
      </div>

      {/* Manage Button */}
      <div className="absolute right-3 top-65 h-8 w-24 rounded-lg bg-gray-300 animate-pulse" />

      {/* Content */}
      <CardContent className="flex flex-col gap-3 p-4 text-sm">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 w-11/12 rounded bg-gray-200 animate-pulse" />
          <div className="h-5 w-8/12 rounded bg-gray-200 animate-pulse" />
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-56 rounded bg-gray-200 animate-pulse" />
        </div>

        {/* Registration Type */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
        </div>

        {/* Conference Type */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
        </div>

        {/* Date */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
        </div>

        {/* Time Zone */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
