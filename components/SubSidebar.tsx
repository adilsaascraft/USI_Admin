// components/Sidebar.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import {
  FaCalendarAlt,
  FaUser,
  FaBuilding,
  FaUsers,
  FaUserCheck,
  FaTruck,
  FaHome,
  FaCog,
} from 'react-icons/fa'
import clsx from 'clsx'

const sidebarItems = [
  { name: 'Faculty', href: '/dashboard', icon: <FaCalendarAlt size={20} /> },
  { name: 'Webinar', href: '/webinar', icon: <FaUsers size={20} /> },
  { name: 'Courses', href: '/courses', icon: <FaUserCheck size={20} /> },
  { name: 'Conference', href: '/conference', icon: <FaUser size={20} /> },
  { name: 'Speakers', href: '/speakers', icon: <FaBuilding size={20} /> },
  { name: 'User Status', href: '/users', icon: <FaTruck size={20} /> },
]

function SidebarComponent() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isMobile) setCollapsed(true)
  }, [isMobile])

  const isActive = (href?: string) => href && pathname === href

  const baseItem =
    'flex items-center gap-2 px-2 py-2 rounded cursor-pointer transition-colors'

  const inactive =
    'text-black hover:bg-white hover:text-orange-800 dark:text-foreground dark:hover:bg-muted dark:hover:text-orange-800'

  const active =
    'bg-white text-orange-800 dark:bg-muted dark:text-orange-800 dark:hover:bg-muted'

  return (
    <motion.div
      animate={{ width: collapsed ? 60 : 240 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="min-h-screen bg-orange-50 p-2 flex flex-col relative dark:bg-background dark:text-foreground border-r overflow-hidden"
    >
      {!isMobile && (
        <div className="relative mb-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`absolute top-1/4 -translate-y-1/2 pr-2 mt-2
              transition-all duration-300 ease-in-out
              ${collapsed ? 'left-3' : '-right-5'}`}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? (
              <FaChevronRight className="w-4 h-4 transition-transform duration-300" />
            ) : (
              <FaChevronLeft className="w-4 h-4 transition-transform duration-300" />
            )}
          </button>
        </div>
      )}

      {isMobile && (
        <Link
          href="/home"
          className={clsx(
            baseItem,
            isActive('/home') ? active : inactive,
            'mb-2 justify-center'
          )}
          title="Home"
        >
          <FaHome size={20} />
        </Link>
      )}

      <nav className="flex flex-col space-y-1 mt-2 flex-1">
        {sidebarItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              baseItem,
              isActive(item.href) ? active : inactive,
              collapsed && 'justify-center'
            )}
            title={collapsed ? item.name : undefined}
          >
            {item.icon}
            {!collapsed && <span className="font-semibold">{item.name}</span>}
          </Link>
        ))}

        {isMobile && (
          <Link
            href="/settings"
            className={clsx(
              baseItem,
              isActive('/settings') ? active : inactive,
              'justify-center mt-2'
            )}
            title="Settings"
          >
            <FaCog size={18} />
          </Link>
        )}
      </nav>
    </motion.div>
  )
}

export default memo(SidebarComponent)
