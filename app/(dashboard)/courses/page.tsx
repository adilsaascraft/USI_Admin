// app/(dashboard)/webinar/page.tsx
'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { CourseType } from '@/types/course'
import CoursePageClient from '@/components/clients/CoursePageClient'

export default function CoursePage() {
  const { data } = useSWR<{ success: boolean; data: CourseType[] }>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/courses`,
    fetcher,
    {
      revalidateOnFocus: true, // refetch on tab focus
      dedupingInterval: 60000, // cache for 60s
    }
  )

  const courses = data?.success ? data.data : []

  return <CoursePageClient initialCourses={courses} />
}

