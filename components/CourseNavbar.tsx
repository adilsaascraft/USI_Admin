'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

import {
  FaCalendarAlt,
  FaUsers,
  FaUserCheck,
  FaUser,
  FaBuilding,
  FaTruck,
} from 'react-icons/fa'

/* ✅ UPDATED MENU ITEMS (as provided) */
const menuItems = [
  { name: 'Week Category', href: '/week', icon: <FaCalendarAlt size={20} /> },
  { name: 'Module', href: '/module', icon: <FaUsers size={20} /> },
]

export default function MobileNavbarAdmin() {
  const pathname = usePathname()
  const navItems = useMemo(() => menuItems, [])

  return (
    <div className="sticky top-[64px] bg-background border-t border-orange-200 z-[30]">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex items-start justify-center gap-6 px-4 py-3 min-w-max">
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
