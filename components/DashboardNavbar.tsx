'use client'

import Image from 'next/image'
import { apiRequest } from '@/lib/apiRequest'
import { HelpCircle, Mail, Phone, MoreVertical } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { mutate as globalMutate } from 'swr'
import { fetchClient } from '@/lib/fetchClient'

export default function DashboardNavbar() {
  const router = useRouter()
  const pathname = usePathname()

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [entityName, setEntityName] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  /* =========================
     Auth check
  ========================= */
  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  /* =========================
     Detect webinar / course name
  ========================= */
  useEffect(() => {
    async function detectEntity() {
      setEntityName(null)

      const segments = pathname.split('/').filter(Boolean)

      // /webinar/:id/...
      if (segments[0] === 'webinar' && segments[1]) {
        try {
          const res = await fetchClient(
            `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${segments[1]}`
          )
          const json = await res.json()
          setEntityName(json?.data?.name || null)
        } catch {
          setEntityName(null)
        }
      }

      // /courses/:id/...
      if (segments[0] === 'courses' && segments[1]) {
        try {
          const res = await fetchClient(
            `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${segments[1]}`
          )
          const json = await res.json()
          setEntityName(json?.data?.courseName || null)
        } catch {
          setEntityName(null)
        }
      }
    }

    detectEntity()
  }, [pathname])

  /* =========================
     Logout
  ========================= */
  const handleLogout = async () => {
    setLoading(true)
    try {
      await apiRequest({
        endpoint: '/api/admin/logout',
        method: 'POST',
        showToast: false,
      })
    } catch (err) {
      console.error('Logout failed')
    } finally {
      localStorage.removeItem('token')
      globalMutate(() => true, undefined, { revalidate: false })
      setIsLoggedIn(false)
      setLogoutDialogOpen(false)
      setMobileMenuOpen(false)
      router.push('/login')
      setLoading(false)
    }
  }

  return (
    <div
      className="sticky top-0 z-50 text-white z-[50]"
      style={{
        background:
          'linear-gradient(90deg, #BCF3FF 0%, #B4EBFE 11%, #B1E7FD 15%, #75A8F2 100%)',
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-[30px]">
        {/* Left */}
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => router.push('/dashboard')}>
            <Image
              src="/usi_logo.png"
              alt="USI Logo"
              width={180}
              height={70}
              className="w-[120px] sm:w-[140px] md:w-[180px] h-auto"
              priority
            />
          </button>
        </div>

        {/* Webinar / Course Name */}
        {entityName && (
          <div
            className="
      text-orange-600 hover:text-orange-700 font-semibold
      text-sm md:text-base
      max-w-[200px] sm:max-w-[300px] md:max-w-[600px]
      line-clamp-2 md:line-clamp-1
    "
          >
            {entityName}
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-4 relative">
          {/* Help – desktop only */}
          <div className="hidden lg:block">
            <HoverCard>
              <HoverCardTrigger>
                <HelpCircle size={20} className="cursor-pointer" />
              </HoverCardTrigger>
              <HoverCardContent className="text-sm p-4 w-72 rounded-md shadow-lg bg-white space-y-3">
                <div className="font-semibold text-gray-800">Need Help?</div>
                <div className="text-gray-600 text-sm">Contact support:</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    support@saascraft.studio
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    +91 73311 31070
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* Desktop logout */}
          <div className="hidden md:block">
            {isLoggedIn && (
              <AlertDialog
                open={logoutDialogOpen}
                onOpenChange={setLogoutDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <button className="border border-white px-4 py-1 rounded-lg font-semibold hover:bg-white hover:text-sky-800 transition">
                    Logout
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to logout?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {loading ? 'Logging out...' : 'Confirm'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden relative">
            <button onClick={() => setMobileMenuOpen((p) => !p)}>
              <MoreVertical />
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-10 bg-white text-black rounded-md shadow-lg w-32">
                <button
                  onClick={() => setLogoutDialogOpen(true)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
