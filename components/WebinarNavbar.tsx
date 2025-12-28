'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

import {
  FaUserGraduate, // Faculty
  FaQuestionCircle, // FAQ
  FaCommentDots, // Feedback
  FaClipboardCheck, // Quiz
  FaHandshake,
  FaArrowLeft, // Meeting
} from 'react-icons/fa'

/* ✅ MENU CONFIG */
const menuItems = [
  {
    name: 'Faculty',
    slug: 'faculty',
    icon: <FaUserGraduate size={20} />,
  },
  {
    name: 'FAQ',
    slug: 'faq',
    icon: <FaQuestionCircle size={20} />,
  },
  {
    name: 'Feedback',
    slug: 'feedback',
    icon: <FaCommentDots size={20} />,
  },
  {
    name: 'Quiz',
    slug: 'quize',
    icon: <FaClipboardCheck size={20} />,
  },
  {
    name: 'Meeting',
    slug: 'meeting',
    icon: <FaHandshake size={20} />,
  },
]


export default function WebinarNavbar() {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()

  const webinarId = params?.webinarId as string

  const navItems = useMemo(() => menuItems, [])

  return (
    <div className="sticky top-[64px] z-[30] border-t border-orange-200 bg-background">
      <div className="flex items-center gap-4 px-4 py-3">
        {/* 🔙 Back Button */}
        <button
          onClick={() => router.push('/webinar')}
          className="flex items-center justify-center rounded-full border border-orange-200 bg-orange-100 p-2 text-orange-600 transition hover:bg-orange-600 hover:text-white"
        >
          <FaArrowLeft size={16} />
        </button>

        {/* Navigation Items */}
        <div className="flex flex-1 justify-center gap-6 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const href = `/webinar/${webinarId}/${item.slug}`

            const isActive =
              pathname === href || pathname.startsWith(`${href}/`)

            return (
              <Link
                key={item.name}
                href={href}
                className="flex flex-col items-center select-none"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200',
                    isActive
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-orange-200 bg-orange-100 text-orange-600'
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
