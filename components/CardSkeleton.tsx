'use client'

import { Card, CardContent } from '@/components/ui/card'

export default function EventCardSkeleton() {
  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-[250px] w-full bg-gray-200" />

      {/* Status Badge Skeleton */}
      <div className="absolute top-65 left-3 h-6 w-20 rounded-full bg-gray-300" />

      {/* Manage Button Skeleton */}
      <div className="absolute right-3 top-65 h-8 w-20 rounded-lg bg-gray-300" />

      {/* Content Skeleton */}
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Title */}
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-5 w-1/2 rounded bg-gray-200" />

        {/* Registration Type */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-200" />
        </div>

        {/* Webinar Type */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 w-36 rounded bg-gray-200" />
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 w-56 rounded bg-gray-200" />
        </div>

        {/* Time Zone */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  )
}
