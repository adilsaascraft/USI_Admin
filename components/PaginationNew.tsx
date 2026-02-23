'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

function buildPages(current: number, total: number) {
  const pages = new Set<number | 'dots'>()

  if (total <= 1) return [1]

  const WINDOW = 2
  current = Math.max(1, Math.min(current, total))

  const start = Math.max(1, current - WINDOW)
  const end = Math.min(total, current + WINDOW)

  pages.add(1)

  if (start > 2) pages.add('dots')

  for (let i = start; i <= end; i++) {
    pages.add(i)
  }

  if (end < total - 1) pages.add('dots')

  pages.add(total)

  return Array.from(pages)
}

export default function Pagination({
  page,
  totalPages,
  onChange,
}: Props) {
  const [jump, setJump] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  /* ---------------- SWIPE SUPPORT ---------------- */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let startX = 0

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const diff = e.changedTouches[0].clientX - startX
      if (diff > 50 && page > 1) onChange(page - 1)
      if (diff < -50 && page < totalPages) onChange(page + 1)
    }

    el.addEventListener('touchstart', handleTouchStart)
    el.addEventListener('touchend', handleTouchEnd)

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [page, totalPages, onChange])

  if (totalPages <= 1) return null

  const pages = buildPages(page, totalPages)

  return (
    <nav
      ref={containerRef}
      className="flex flex-col items-center gap-4 mt-10"
      aria-label="Pagination Navigation"
    >
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">

        {/* Prev */}
        <button
          rel="prev"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="px-3 py-1 text-sm border rounded disabled:opacity-40"
        >
          Prev
        </button>

        {/* Pages */}
        <AnimatePresence mode="popLayout">
          {pages.map((item, idx) =>
            item === 'dots' ? (
              <motion.span
                key={`dots-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-2 text-gray-500"
              >
                …
              </motion.span>
            ) : (
              <motion.button
                key={item}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => onChange(item)}
                className={`min-w-[36px] h-9 px-3 text-sm rounded transition
                  ${
                    page === item
                      ? 'bg-orange-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
              >
                {item}
              </motion.button>
            )
          )}
        </AnimatePresence>

        {/* Next */}
        <button
          rel="next"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="px-3 py-1 text-sm border rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {/* Jump To */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const p = Number(jump)
              if (p >= 1 && p <= totalPages) {
                onChange(p)
                setJump('')
              }
            }
          }}
          className="w-16 px-2 py-1 border rounded text-sm"
        />
      </div>
    </nav>
  )
}