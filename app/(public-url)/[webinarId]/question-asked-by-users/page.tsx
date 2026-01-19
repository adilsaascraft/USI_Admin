'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

/* ================= TYPES ================= */

type Webinar = {
  _id: string
  name: string
  webinarType: string
  dynamicStatus: string
}

type Question = {
  _id: string
  questionName: string
  createdAt: string
  userId: {
    _id: string
    name: string
    email?: string
    mobile?: string
    profilePicture?: string
  }
  webinarId: Webinar
}

type SortOrder = 'newest' | 'oldest'

/* ================= UTILS ================= */

const formatDateTime = (date: string) => {
  const d = new Date(date)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const ITEMS_PER_PAGE = 30

/* ================= PAGE ================= */

export default function Page() {
  const { webinarId } = useParams()

  if (!webinarId || Array.isArray(webinarId)) return null

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  /* ================= FETCH (PUBLIC – NO AUTH) ================= */

  const { data, isLoading, error, mutate, isValidating } = useSWR<{
    data: Question[]
  }>(
    `${process.env.NEXT_PUBLIC__URL}/webinars/${webinarId}/questions`,
    async (url: string) => {
      const res = await fetch(url)

      if (!res.ok) {
        throw new Error('Failed to fetch questions')
      }

      return res.json()
    }
  )

  /* ================= MEMOIZED VALUES ================= */

  const webinarName = useMemo(() => {
    return data?.data?.[0]?.webinarId?.name ?? 'Webinar Questions'
  }, [data])

  const filteredAndSortedQuestions = useMemo(() => {
    let list = data?.data ?? []

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (item) =>
          item.questionName.toLowerCase().includes(q) ||
          item.userId?.name?.toLowerCase().includes(q) ||
          item.userId?.email?.toLowerCase().includes(q) ||
          item.userId?.mobile?.toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB
    })
  }, [data, search, sortOrder])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedQuestions.length / ITEMS_PER_PAGE)
  }, [filteredAndSortedQuestions.length])

  const paginatedQuestions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredAndSortedQuestions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAndSortedQuestions, page])

  /* ================= EFFECTS ================= */

  useEffect(() => {
    setPage(1)
  }, [search, sortOrder])

  /* ================= STATES ================= */

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Failed to load questions
      </div>
    )
  }

  /* ================= RENDER ================= */

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl text-center text-sky-800 font-semibold">
          {webinarName}
        </h2>

        <h3 className="text-lg text-center text-muted-foreground">
          All Questions Asked By Users
        </h3>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Input
            placeholder="Search by name, email, mobile or question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Filter</label>

            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as SortOrder)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => mutate()}
              disabled={isValidating}
              title="Refresh questions"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Cards */}
      {paginatedQuestions.length === 0 ? (
        <p className="text-muted-foreground text-center">No questions found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedQuestions.map((q) => (
            <div
              key={q._id}
              className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              {/* User */}
              <div className="flex gap-3">
                <Image
                  src={q.userId?.profilePicture || '/avatar.png'}
                  alt={q.userId?.name}
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />

                <div>
                  <p className="font-medium">{q.userId?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {q.userId?.email || q.userId?.mobile || '—'}
                  </p>
                </div>
              </div>

              {/* Question */}
              <div className="mt-4">
                <span className="font-semibold">Question:</span>{' '}
                {q.questionName}
              </div>

              {/* Time */}
              <div className="mt-2 text-sm text-muted-foreground">
                {formatDateTime(q.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-6 flex-wrap">
          {page > 1 && (
            <button
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
            >
              Previous
            </button>
          )}

          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNumber = i + 1

            if (
              pageNumber === 1 ||
              pageNumber === totalPages ||
              Math.abs(pageNumber - page) <= 1
            ) {
              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`rounded-md px-3 py-1 text-sm border ${
                    page === pageNumber
                      ? 'bg-primary text-white'
                      : 'hover:bg-muted'
                  }`}
                >
                  {pageNumber}
                </button>
              )
            }

            if (pageNumber === page - 2 || pageNumber === page + 2) {
              return (
                <span key={pageNumber} className="px-2 text-muted-foreground">
                  ...
                </span>
              )
            }

            return null
          })}

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
