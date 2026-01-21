'use client'

import Image from 'next/image'
import { HelpCircle, Mail, Phone, MoreVertical } from 'lucide-react'
import { useState, useEffect } from 'react'
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

import { fetchClient } from '@/lib/fetchClient'
import { useAuthStore } from '@/stores/authStore'

export default function DashboardNavbar() {
  const router = useRouter()
  const pathname = usePathname()

  // ✅ CORRECT AUTH FLAG
  const { isAuthenticated, logout } = useAuthStore()

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [entityName, setEntityName] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  /* =========================
     Detect webinar / course name
  ========================= */
  useEffect(() => {
    async function detectEntity() {
      setEntityName(null)

      const segments = pathname.split('/').filter(Boolean)

      if (segments[0] === 'webinar' && segments[1]) {
        try {
          const res = await fetchClient(
            `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${segments[1]}`,
          )
          const json = await res.json()
          setEntityName(json?.data?.name || null)
        } catch {
          setEntityName(null)
        }
      }

      if (segments[0] === 'courses' && segments[1]) {
        try {
          const res = await fetchClient(
            `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${segments[1]}`,
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
     Logout (CORRECT & SINGLE SOURCE)
  ========================= */
  const handleLogout = async () => {
    setLoading(true)

    try {
      await logout() // ✅ calls API + clears store
    } catch (err) {
      console.error('Logout failed', err)
    } finally {
      setLogoutDialogOpen(false)
      setMobileMenuOpen(false)

      // 🔁 MUST be replace (not push)
      router.replace('/login')

      setLoading(false)
    }
  }

  return (
    <div
      className="sticky top-0 z-50 text-white"
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
          <div className="text-orange-600 font-semibold text-sm md:text-base line-clamp-1">
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
              <HoverCardContent className="text-sm p-4 w-72 bg-white rounded-md shadow-lg space-y-3">
                <div className="font-semibold text-gray-800">Need Help?</div>
                <div className="text-gray-600">Contact support:</div>
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
          {isAuthenticated && (
            <div className="hidden md:block">
              <AlertDialog
                open={logoutDialogOpen}
                onOpenChange={setLogoutDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <button className="border border-white px-4 py-1 rounded-lg font-semibold hover:bg-white hover:text-orange-700 transition">
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
            </div>
          )}

          {/* Mobile menu */}
          {isAuthenticated && (
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
          )}
        </div>
      </div>
    </div>
  )
}
