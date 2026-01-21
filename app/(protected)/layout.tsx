'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

import DashboardNavbar from '@/components/DashboardNavbar'
import Navbar from '@/components/Navbar'
import WebinarNavbar from '@/components/WebinarNavbar'
import CourseNavbar from '@/components/CourseNavbar'
import ConferenceNavbar from '@/components/ConferenceNavbar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const { isAuthenticated, isLoading, hydrate } = useAuthStore()

  // =============================
  // 🔐 AUTH BOOTSTRAP
  // =============================
  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated])

  // ⛔ Prevent UI flicker while checking session
  if (isLoading) return null

  // =============================
  // 🔍 PATH MATCHING LOGIC
  // =============================

  // Webinar
  const isWebinarRoot = pathname === '/webinar'
  const isInsideWebinar =
    pathname.startsWith('/webinar/') && pathname.split('/').length > 2

  // Course
  const isCourseRoot = pathname === '/courses'
  const isInsideCourse =
    pathname.startsWith('/courses/') && pathname.split('/').length > 2

  // Conference
  const isConferenceRoot = pathname === '/conference'
  const isInsideConference =
    pathname.startsWith('/conference/') && pathname.split('/').length > 2

  // Generic top-level routes
  const isTopLevelRoute =
    !isInsideWebinar && !isInsideCourse && !isInsideConference

  // =============================
  // 🧭 NAVBAR SELECTION
  // =============================

  let ActiveNavbar = null

  if (isInsideWebinar) {
    ActiveNavbar = <WebinarNavbar />
  } else if (isInsideCourse) {
    ActiveNavbar = <CourseNavbar />
  } else if (isInsideConference) {
    ActiveNavbar = <ConferenceNavbar />
  } else if (isTopLevelRoute) {
    ActiveNavbar = <Navbar />
  }

  return (
    <>
      {/* ✅ Always visible */}
      <DashboardNavbar />

      {/* ✅ Exactly ONE contextual navbar */}
      {ActiveNavbar && <div>{ActiveNavbar}</div>}

      {/* ✅ Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </>
  )
}
