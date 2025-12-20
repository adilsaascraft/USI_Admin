"use client"

import { Card, CardContent } from "@/components/ui/card"

export default function EventCardSkeleton() {
  return (
    <Card className="flex flex-col md:flex-row items-start md:items-center p-4 gap-4 relative shadow-sm animate-pulse">
      {/* Event Image Skeleton */}
      <div className="w-[150px] h-[200px] bg-gray-200 rounded-md" />

      {/* Content Skeleton */}
      <CardContent className="flex-1 w-full p-0 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-5 w-16 bg-gray-200 rounded" />
        </div>

        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="flex gap-4">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="flex gap-4">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </CardContent>

      {/* Manage Button Skeleton */}
      <div className="absolute top-4 right-4 h-9 w-20 bg-gray-200 rounded" />
    </Card>
  )
}
