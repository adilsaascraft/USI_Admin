'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

import {
  FaThLarge, // Dashboard (grid-style)
  FaVideo, // Webinar
  FaBookOpen, // Courses
  FaUsers, // Conference
  FaUserGraduate, // Speakers (faculty / graduate)
  FaUserShield, // User Status
} from 'react-icons/fa'

const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <FaThLarge size={20} />,
  },
  {
    name: 'Webinar',
    href: '/webinar',
    icon: <FaVideo size={20} />,
  },
  {
    name: 'Courses',
    href: '/courses',
    icon: <FaBookOpen size={20} />,
  },
  {
    name: 'Conference',
    href: '/conference',
    icon: <FaUsers size={20} />,
  },
  {
    name: 'Speakers',
    href: '/speakers',
    icon: <FaUserGraduate size={20} />,
  },
  {
    name: 'User Status',
    href: '/users',
    icon: <FaUserShield size={20} />,
  },
]


export default function MobileNavbarAdmin() {
  const pathname = usePathname()
  const navItems = useMemo(() => menuItems, [])

  return (
    <div className="sticky top-[64px] bg-background border-t border-orange-200 z-[30]">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex items-start justify-center gap-6 px-3 py-1 min-w-max">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center select-none"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200',
                    isActive
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-orange-100 text-orange-600 border-orange-200'
                  )}
                >
                  {item.icon}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'mt-1 text-xs font-medium transition-colors',
                    isActive ? 'text-orange-600' : 'text-foreground'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
