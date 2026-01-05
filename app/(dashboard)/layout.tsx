'use client'

import { usePathname } from 'next/navigation'
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
  const isTopLevelRoute = !isInsideWebinar && !isInsideCourse && !isInsideConference

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
    
  }
  
  else if (isTopLevelRoute) {
    ActiveNavbar = <Navbar />
  }

  return (
   
      <>
        {/* ✅ Always visible */}
        <DashboardNavbar />

        {/* ✅ Exactly ONE navbar renders */}
        {ActiveNavbar && (
          <div>{ActiveNavbar}</div>
        )}

        {/* ✅ Main Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </>
    
  )
}
