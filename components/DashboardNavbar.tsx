'use client'

import Image from 'next/image'
import { apiRequest } from '@/lib/apiRequest'
import { HelpCircle, Mail, Phone } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { mutate as globalMutate } from 'swr'


export default function DashboardNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  // logout function
  const handleLogout = async () => {
  setLoading(true)

  try {
    await apiRequest({
      endpoint: '/api/admin/logout',
      method: 'POST',
      showToast: false,
    })
  } catch (err: any) {
    // Log only – logout should continue even if API fails
    console.error('Logout failed:', err?.message)
  } finally {
    // 🔐 Always clear local state
    localStorage.removeItem('token')
    localStorage.removeItem('selectedEvent')

    globalMutate(() => true, undefined, { revalidate: false })

    setIsLoggedIn(false)
    setLogoutDialogOpen(false)

    router.push('/login')
    setLoading(false)
  }
}


  const isActive = (path: string) => pathname === path

  return (
<header
  className="
    text-white
    sticky top-0 z-50
  "
  style={{
          // Navbar-specific gradient
          background:
            'linear-gradient(90deg, #BCF3FF 0%, #B4EBFE 11%, #B1E7FD 15%, #75A8F2 100%)',
        }}
>
      <div className="max-w-full flex items-center justify-between h-16 px-4 md:px-[30px]">
        {/* Left: Logo */}
        <div className="flex items-center">
          <button onClick={() => router.push('/dashboard')}>
            <Image
              src="/usi_logo.png"
              alt="Usi Logo"
              width={200}
              height={80}
              className="cursor-pointer"
            />
          </button>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>

          

          <HoverCard>
            <HoverCardTrigger>
              <HelpCircle size={20} className="cursor-pointer" />
            </HoverCardTrigger>
            <HoverCardContent className="text-sm p-4 w-72 rounded-md shadow-lg border border-gray-200 bg-white dark:bg-gray-800 space-y-3">
              <div className="font-semibold text-gray-800 dark:text-gray-100">Need Help?</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                If you&apos;re facing any issues or need assistance, feel free to reach out:
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-blue-600" />
                  <a href="mailto:support@saascraft.studio" className="text-blue-600 hover:underline text-sm">
                    support@saascraft.studio
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-blue-600" />
                  <a href="tel:+917331131070" className="text-blue-600 hover:underline text-sm">
                    +91 73311 31070
                  </a>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          <div className="relative">
            {isLoggedIn && (
              <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogTrigger asChild>
                  <button className="text-white border border-white text-sm px-4 py-1 rounded-lg font-semibold hover:bg-white hover:text-sky-800 transition">
                    Logout
                  </button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to logout? This will end your session.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                      {loading ? "Logging out..." : "Confirm"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
